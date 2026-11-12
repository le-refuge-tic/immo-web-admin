/**
 * Règle du projet : toute confirmation passe par une boîte de dialogue (jamais
 * window.confirm). Ce module gère la file des demandes et renvoie une Promise ;
 * le rendu visuel est fourni par chaque front (prop `Rendu`).
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/dialogues).
 *
 *   const { confirmer } = useConfirm()   // ./useConfirm
 *   if (!(await confirmer({ titre: 'Supprimer ce brouillon ?', message: '…', danger: true }))) return
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react'
import { ContexteConfirm, type DemandeChoix, type DemandeConfirmation, type ProprietesRendu } from './useConfirm'

interface EnCours { demande: DemandeChoix<unknown>; resoudre: (v: unknown) => void }

const SELECTEUR_FOCUS = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Focus piégé dans la boîte, Échap pour fermer, focus rendu à la fermeture. */
function usePiegeFocus(ref: RefObject<HTMLDivElement | null>, ouvert: boolean, fermer: () => void) {
  const fermerRef = useRef(fermer)
  useEffect(() => { fermerRef.current = fermer }, [fermer])
  useEffect(() => {
    if (!ouvert) return
    const precedent = document.activeElement as HTMLElement | null
    const focusables = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(SELECTEUR_FOCUS) ?? [])
    const initial = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0]
    initial?.focus()
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); fermerRef.current(); return }
      if (e.key !== 'Tab') return
      const liste = focusables()
      if (!liste.length) return
      const premier = liste[0]
      const dernier = liste[liste.length - 1]
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus() }
    }
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('keydown', surTouche)
      precedent?.focus?.()
    }
  }, [ouvert, ref])
}

let compteur = 0

export function ConfirmProvider({ Rendu, children }: { Rendu: ComponentType<ProprietesRendu>; children: ReactNode }) {
  const [file, setFile] = useState<EnCours[]>([])
  const courant = file[0]
  const refDialogue = useRef<HTMLDivElement | null>(null)
  const [ids] = useState(() => { compteur += 1; return { titre: `dlg-titre-${compteur}`, message: `dlg-msg-${compteur}` } })

  const choisir = useCallback(<T,>(demande: DemandeChoix<T>) => new Promise<T | null>(resolve => {
    setFile(prev => [...prev, { demande: demande as DemandeChoix<unknown>, resoudre: v => resolve(v as T | null) }])
  }), [])

  const confirmer = useCallback(async (d: DemandeConfirmation) => {
    const r = await choisir<boolean>({
      titre: d.titre,
      message: d.message,
      actions: [
        { valeur: false, libelle: d.annuler ?? 'Annuler', ton: 'neutre' },
        { valeur: true, libelle: d.confirmer ?? 'Confirmer', ton: d.danger ? 'danger' : 'primaire' },
      ],
    })
    return r === true
  }, [choisir])

  const repondre = useCallback((valeur: unknown) => {
    if (!courant) return
    courant.resoudre(valeur)
    setFile(prev => prev.filter(d => d !== courant))
  }, [courant])

  usePiegeFocus(refDialogue, !!courant, () => repondre(null))

  const valeur = useMemo(() => ({ confirmer, choisir }), [confirmer, choisir])
  return (
    <ContexteConfirm.Provider value={valeur}>
      {children}
      {courant && (
        <Rendu
          titre={courant.demande.titre}
          message={courant.demande.message}
          actions={courant.demande.actions}
          repondre={repondre}
          idTitre={ids.titre}
          idMessage={ids.message}
          refDialogue={refDialogue}
        />
      )}
    </ContexteConfirm.Provider>
  )
}
