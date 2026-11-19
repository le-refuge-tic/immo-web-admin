/**
 * Lot 15 — validation des formulaires par schéma zod : erreurs par champ, rattachement des
 * messages du backend au bon champ, et hook `useValidation` (erreur à la sortie du champ et
 * à la soumission, focus sur le premier champ en erreur, envoi unique).
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { z } from 'zod'

export type Erreurs = Record<string, string>

/** Première erreur de chaque champ (chemin de premier niveau). */
export function erreursZod(e: z.ZodError): Erreurs {
  const r: Erreurs = {}
  for (const i of e.issues) {
    const cle = String(i.path[0] ?? '_')
    if (!(cle in r)) r[cle] = i.message
  }
  return r
}

export type Resultat<T> = { ok: true; data: T } | { ok: false; erreurs: Erreurs }

export function valider<S extends z.ZodTypeAny>(schema: S, valeurs: unknown): Resultat<z.output<S>> {
  const r = schema.safeParse(valeurs)
  return r.success ? { ok: true, data: r.data } : { ok: false, erreurs: erreursZod(r.error) }
}

/**
 * Messages d'une erreur Axios du backend → champ concerné. Les messages de class-validator
 * commencent par le nom de la propriété (« telephone must be… ») ; les messages français
 * sont reconnus par les mots-clés fournis. Ce qui ne correspond à aucun champ reste global.
 */
export function erreursServeur(
  err: unknown,
  champs: Record<string, RegExp>,
): { parChamp: Erreurs; global: string[] } {
  const brut = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  const messages = (Array.isArray(brut) ? brut : brut ? [brut] : []).map(String)
  const parChamp: Erreurs = {}
  const global: string[] = []
  for (const m of messages) {
    const champ = Object.keys(champs).find(c => m.startsWith(`${c} `) || champs[c].test(m))
    if (champ && !(champ in parChamp)) parChamp[champ] = m
    else if (!champ) global.push(m)
  }
  return { parChamp, global }
}

/** Identifiant du message d'erreur d'un champ (pour `aria-describedby`). */
export const idErreur = (formulaire: string, champ: string) => `${formulaire}-${champ}-erreur`

/**
 * Validation d'un formulaire contrôlé. `valeurs` est l'état courant ; le schéma décide.
 * Les champs doivent porter `name={champ}` (fourni par `propsChamp`) pour le focus.
 */
export function useValidation<S extends z.ZodTypeAny>(formulaire: string, schema: S, valeurs: unknown) {
  const [touches, setTouches] = useState<Record<string, boolean>>({})
  const [tout, setTout] = useState(false)
  const [serveur, setServeur] = useState<Erreurs>({})
  const [envoiEnCours, setEnvoi] = useState(false)
  const verrou = useRef(false)

  const resultat = useMemo(() => valider(schema, valeurs), [schema, valeurs])
  const erreursCompletes = resultat.ok ? {} : resultat.erreurs
  const erreurs: Erreurs = { ...serveur }
  for (const [c, m] of Object.entries(erreursCompletes)) if (tout || touches[c]) erreurs[c] = m

  const quitter = useCallback((champ: string) => setTouches(t => (t[champ] ? t : { ...t, [champ]: true })), [])

  const propsChamp = (champ: string) => ({
    name: champ,
    id: `${formulaire}-${champ}`,
    onBlur: () => quitter(champ),
    'aria-invalid': erreurs[champ] ? true : undefined,
    'aria-describedby': erreurs[champ] ? idErreur(formulaire, champ) : undefined,
  })

  /** Valide tout ; si c'est bon, envoie une seule fois (double clic ignoré). */
  const soumettre = async (envoyer: (data: z.output<S>) => Promise<void> | void) => {
    if (verrou.current) return
    setTout(true)
    setServeur({})
    if (!resultat.ok) {
      const premier = Object.keys(resultat.erreurs)[0]
      const el = document.getElementById(`${formulaire}-${premier}`) ?? document.querySelector<HTMLElement>(`[name="${premier}"]`)
      el?.focus()
      return
    }
    verrou.current = true
    setEnvoi(true)
    try {
      await envoyer(resultat.data)
    } finally {
      verrou.current = false
      setEnvoi(false)
    }
  }

  /**
   * Après un échec de l'API : place ses messages sous les bons champs. Renvoie `true` si au
   * moins un message a été rattaché (sinon l'appelant affiche son message global).
   */
  const erreursDuServeur = (err: unknown, champs: Record<string, RegExp>): boolean => {
    const { parChamp } = erreursServeur(err, champs)
    setServeur(parChamp)
    const premier = Object.keys(parChamp)[0]
    if (premier) document.getElementById(`${formulaire}-${premier}`)?.focus()
    return premier !== undefined
  }

  const effacerErreurServeur = (champ: string) =>
    setServeur(s => {
      if (!(champ in s)) return s
      const copie = { ...s }
      delete copie[champ]
      return copie
    })

  return { erreurs, valide: resultat.ok, propsChamp, quitter, soumettre, envoiEnCours, erreursDuServeur, effacerErreurServeur }
}
