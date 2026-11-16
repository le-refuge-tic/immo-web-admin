/**
 * Lot 1 — gestionnaire d'envois de médias, monté au-dessus des routes : les
 * photos continuent de partir quand on change de page, et reprennent après un
 * rechargement (fichiers gardés dans IndexedDB).
 * Fichier identique dans immo-web-admin et immo-web-user (src/shared/uploads) ;
 * l'affichage (indicateur, bannière) est propre à chaque front.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { avancement, creerLot, executerLot, preparerReprise, type Envoyeur, type LotEnvoi } from './fileEnvoi'
import { ContexteEnvois, MESSAGE_DEPART, messageEchec, messageFin, type DemandeEnvoi, type Notifier } from './useGestionEnvois'
import { enregistrerEtat, enregistrerNouveauLot, lireLots, supprimerLot } from './stockageEnvoi'

/**
 * `utilisateurId` : compte connecté (null = déconnecté). Au changement de compte,
 * les envois en cours s'arrêtent et seuls les envois du nouveau compte sont proposés.
 */
export function GestionEnvoisProvider({ envoyer, notifier, utilisateurId, children }: {
  envoyer: Envoyeur
  notifier: Notifier
  utilisateurId: number | null
  children: ReactNode
}) {
  const [lots, setLots] = useState<LotEnvoi[]>([])
  const [interrompus, setInterrompus] = useState<LotEnvoi[]>([])
  const actifs = useRef(new Set<string>())
  // Lots arrêtés par une déconnexion : leurs dernières mises à jour sont ignorées.
  const arretes = useRef(new Set<string>())
  const envoyerRef = useRef(envoyer)
  const notifierRef = useRef(notifier)
  useEffect(() => { envoyerRef.current = envoyer; notifierRef.current = notifier }, [envoyer, notifier])

  const remplacer = useCallback((lot: LotEnvoi) => {
    setLots(prev => (prev.some(l => l.id === lot.id) ? prev.map(l => (l.id === lot.id ? lot : l)) : [...prev, lot]))
  }, [])

  const lancer = useCallback((depart: LotEnvoi, nouveau: boolean) => {
    if (actifs.current.has(depart.id)) return
    actifs.current.add(depart.id)
    remplacer(depart)
    void (nouveau ? enregistrerNouveauLot(depart) : enregistrerEtat(depart))
    const arrete = () => arretes.current.has(depart.id)
    const pourEnvoi: Envoyeur = (bienId, el) => envoyerRef.current(bienId, el)
    void executerLot(depart, pourEnvoi, lot => {
      if (arrete()) return
      remplacer(lot)
      void enregistrerEtat(lot)
    }, { annule: arrete }).then(fin => {
      actifs.current.delete(fin.id)
      if (arrete()) return
      if (avancement(fin).echecs > 0) {
        remplacer(fin)
        void enregistrerEtat(fin)
        notifierRef.current(messageEchec(fin), 'error')
        return
      }
      setLots(prev => prev.filter(l => l.id !== fin.id))
      void supprimerLot(fin)
      notifierRef.current(messageFin(fin.libelle), 'success')
    })
  }, [remplacer])

  // Changement de compte (ou déconnexion) : arrêt des envois du compte précédent,
  // puis envois laissés en plan par un rechargement proposés à la reprise.
  const [pourUtilisateur, setPourUtilisateur] = useState(utilisateurId)
  if (pourUtilisateur !== utilisateurId) {
    setPourUtilisateur(utilisateurId)
    setLots([])
    setInterrompus([])
  }
  useEffect(() => {
    for (const id of actifs.current) arretes.current.add(id)
    if (utilisateurId === null) return
    let actif = true
    void lireLots(utilisateurId).then(trouves => {
      if (actif && trouves.length) setInterrompus(trouves.filter(l => !actifs.current.has(l.id)))
    })
    return () => { actif = false }
  }, [utilisateurId])

  const enCours = lots.some(l => avancement(l).enCours)
  useEffect(() => {
    if (!enCours) return
    const avertir = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', avertir)
    return () => window.removeEventListener('beforeunload', avertir)
  }, [enCours])

  const demarrer = useCallback((demande: DemandeEnvoi) => {
    if (utilisateurId === null || (!demande.photos.length && !demande.video)) return
    lancer(creerLot({ ...demande, utilisateurId }), true)
    notifierRef.current(MESSAGE_DEPART, 'info')
  }, [lancer, utilisateurId])

  const reprendre = useCallback((lotId: string) => {
    const lot = interrompus.find(l => l.id === lotId) ?? lots.find(l => l.id === lotId)
    if (!lot) return
    setInterrompus(prev => prev.filter(l => l.id !== lotId))
    lancer(preparerReprise(lot), false)
  }, [interrompus, lots, lancer])

  const abandonner = useCallback((lotId: string) => {
    if (actifs.current.has(lotId)) return
    const lot = interrompus.find(l => l.id === lotId) ?? lots.find(l => l.id === lotId)
    setInterrompus(prev => prev.filter(l => l.id !== lotId))
    setLots(prev => prev.filter(l => l.id !== lotId))
    if (lot) void supprimerLot(lot)
  }, [interrompus, lots])

  const valeur = useMemo(() => ({ lots, interrompus, demarrer, reprendre, abandonner }), [lots, interrompus, demarrer, reprendre, abandonner])
  return <ContexteEnvois.Provider value={valeur}>{children}</ContexteEnvois.Provider>
}
