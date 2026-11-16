import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  enregistrerBrouillon, libelleParNom, lireBrouillon, listerBrouillons, nouvelIdBrouillon, supprimerBrouillon,
} from './brouillonsLocaux'
import { useVersionDistante } from '../../../shared/brouillons/useSynchroBrouillons'

type FamilleDediee = 'guesthouse' | 'salle_fete'
/** `version` : date du brouillon lu (lot 6, pour ne jamais écraser une version plus récente). */
type Etat<T> = { form: T; etape: number; id: string; version: number }

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
      ? { form: { ...vide(), ...b.donnees }, etape: Math.min(b.etape, nbEtapes - 1), id: b.id, version: b.updatedAt }
      : { form: vide(), etape: 0, id: nouvelIdBrouillon(), version: 0 }
  }

  const [etat, setEtat] = useState<Etat<T>>(() => charger(idDemande))
  const [version, setVersion] = useState(0)
  const termine = useRef(false)
  /** Date de la dernière écriture faite par cette page (lot 6). */
  const derniereEcriture = useRef(0)
  const versionConnue = () => Math.max(etat.version, derniereEcriture.current)
  const versionStockee = () => lireBrouillon<T>(famille, etat.id, libelleDe)?.updatedAt ?? 0
  // Version plus récente reçue d'un autre appareil : plus d'écriture jusqu'au choix de l'utilisateur.
  const versionDistante = useVersionDistante(() => versionStockee() > versionConnue())

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
    const stocke = lireBrouillon<T>(famille, etat.id, libelleDe)
    if (!stocke && etat.etape === 0 && JSON.stringify(etat.form) === vierge) return
    if (stocke && stocke.updatedAt > Math.max(etat.version, derniereEcriture.current)) return
    // Rien de changé (ouverture de la page) : la date ne bouge pas, rien n'est renvoyé au serveur.
    if (stocke && stocke.etape === etat.etape && JSON.stringify({ ...vide(), ...stocke.donnees }) === JSON.stringify(etat.form)) return
    const updatedAt = Date.now()
    enregistrerBrouillon({
      id: etat.id, famille, libelle: libelleDe(etat.form), etape: etat.etape, updatedAt, donnees: etat.form,
    }, libelleDe)
    derniereEcriture.current = updatedAt
    const deja = !!stocke
    if (!deja) setParams(p => { p.set('draft', etat.id); return p }, { replace: true })
  }, [etat, famille, libelleDe, vierge, vide, setParams])

  const maj = useCallback((patch: Partial<T>) => setEtat(e => ({ ...e, form: { ...e.form, ...patch } })), [])
  const setEtape = useCallback((etape: number) => setEtat(e => ({ ...e, etape })), [])

  /** Supprime un brouillon ; celui en cours : la saisie repart de zéro. */
  const supprimer = (id: string) => {
    supprimerBrouillon(famille, id)
    setVersion(v => v + 1)
    if (id === etat.id) {
      setEtat({ form: vide(), etape: 0, id: nouvelIdBrouillon(), version: 0 })
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

  /** Lot 6 : choix devant une version plus récente venue d'un autre appareil. */
  const conflit = versionDistante.conflit ? {
    charger: () => { derniereEcriture.current = 0; setEtat(charger(etat.id)); versionDistante.fermer() },
    garder: () => { derniereEcriture.current = versionStockee(); setEtat(e => ({ ...e })); versionDistante.fermer() },
  } : null

  return { form: etat.form, maj, etape: etat.etape, setEtape, brouillonId: existe ? etat.id : null, lister, supprimer, terminer, conflit }
}
