import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  enregistrerBrouillon, libelleParNom, lireBrouillon, listerBrouillons, nouvelIdBrouillon, supprimerBrouillon,
} from './brouillonsLocaux'

type FamilleDediee = 'guesthouse' | 'salle_fete'
type Etat<T> = { form: T; etape: number; id: string }

/**
 * Lot 3 — formulaire guesthouse ou salle de fêtes adossé à un brouillon : `?draft=<id>` reprend
 * ce brouillon ; sans paramètre, un brouillon naît à la première saisie. Chaque modification
 * (champs ou étape) est enregistrée sur cet appareil.
 */
export function useBrouillonFormulaire<T extends { nom: string }>(famille: FamilleDediee, vide: () => T, nbEtapes: number) {
  const [params, setParams] = useSearchParams()
  const idDemande = params.get('draft')
  const libelleDe = useMemo(() => libelleParNom(famille), [famille])

  const charger = (id: string | null): Etat<T> => {
    const b = id ? lireBrouillon<T>(famille, id, libelleDe) : null
    return b
      ? { form: { ...vide(), ...b.donnees }, etape: Math.min(b.etape, nbEtapes - 1), id: b.id }
      : { form: vide(), etape: 0, id: nouvelIdBrouillon() }
  }

  const [etat, setEtat] = useState<Etat<T>>(() => charger(idDemande))
  const [version, setVersion] = useState(0)
  const termine = useRef(false)

  // Autre brouillon choisi dans le menu (nouveau ?draft=) : rechargé pendant le rendu.
  const [idSuivi, setIdSuivi] = useState(idDemande)
  if (idDemande !== idSuivi) {
    setIdSuivi(idDemande)
    if (idDemande && idDemande !== etat.id) setEtat(charger(idDemande))
  }

  const brouillons = useMemo(
    () => listerBrouillons<T>(famille, libelleDe),
    // etat et version : relire après chaque enregistrement ou suppression
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [famille, libelleDe, etat, version],
  )
  const existe = brouillons.some(b => b.id === etat.id)

  // Enregistrement : dès que la saisie s'écarte d'un formulaire vierge (ou que le brouillon existe).
  const vierge = useMemo(() => JSON.stringify(vide()), [vide])
  useEffect(() => {
    if (termine.current) return
    const deja = listerBrouillons<T>(famille, libelleDe).some(b => b.id === etat.id)
    if (!deja && etat.etape === 0 && JSON.stringify(etat.form) === vierge) return
    enregistrerBrouillon({
      id: etat.id, famille, libelle: libelleDe(etat.form), etape: etat.etape, updatedAt: Date.now(), donnees: etat.form,
    }, libelleDe)
    if (!deja) setParams(p => { p.set('draft', etat.id); return p }, { replace: true })
  }, [etat, famille, libelleDe, vierge, setParams])

  const maj = useCallback((patch: Partial<T>) => setEtat(e => ({ ...e, form: { ...e.form, ...patch } })), [])
  const setEtape = useCallback((etape: number) => setEtat(e => ({ ...e, etape })), [])

  /** Supprime un brouillon ; celui en cours : la saisie repart de zéro. */
  const supprimer = (id: string) => {
    supprimerBrouillon(famille, id)
    setVersion(v => v + 1)
    if (id === etat.id) {
      setEtat({ form: vide(), etape: 0, id: nouvelIdBrouillon() })
      setIdSuivi(null)
      setParams(p => { p.delete('draft'); return p }, { replace: true })
    }
  }

  /** Après l'envoi : le brouillon n'a plus lieu d'être, et plus rien ne doit le recréer. */
  const terminer = () => {
    termine.current = true
    supprimerBrouillon(famille, etat.id)
  }

  /** Liste à jour (lue à l'ouverture du menu, après l'enregistrement de la dernière saisie). */
  const lister = useCallback(() => listerBrouillons<T>(famille, libelleDe), [famille, libelleDe])

  return { form: etat.form, maj, etape: etat.etape, setEtape, brouillonId: existe ? etat.id : null, lister, supprimer, terminer }
}
