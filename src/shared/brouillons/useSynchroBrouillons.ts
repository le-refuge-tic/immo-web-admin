import { useEffect, useRef, useState } from 'react'
import { synchroniser, type ApiBrouillons, type EtatEnregistre, type MagasinBrouillons, type StockageEtat } from './synchroniser'

/** Émis après une saisie ou une suppression de brouillon sur cet appareil. */
export const EVENEMENT_BROUILLONS_MODIFIES = 'brouillons:modifies'
/** Émis quand la synchronisation a changé les brouillons de cet appareil (listes à relire). */
export const EVENEMENT_BROUILLONS_SYNCHRONISES = 'brouillons:synchronises'

/** Délai après la dernière saisie avant l'envoi au serveur. */
export const DELAI_ENVOI_MS = 1500

/** Passe forcée de la synchronisation active (une seule par application). */
let passeForcee: (() => Promise<void>) | null = null

/**
 * Avant une déconnexion : envoie les dernières saisies au serveur (au plus `delaiMs`), pour
 * qu'elles survivent à l'effacement des brouillons de l'appareil.
 */
export async function synchroniserAvantDeconnexion(delaiMs = 3000): Promise<void> {
  if (!passeForcee) return
  await Promise.race([passeForcee().catch(() => {}), new Promise(r => setTimeout(r, delaiMs))])
}

export function signalerBrouillonsModifies(): void {
  try { window.dispatchEvent(new Event(EVENEMENT_BROUILLONS_MODIFIES)) } catch { /* hors navigateur */ }
}

/** État de synchronisation gardé dans le navigateur sous `cle`. */
export function stockageEtatLocal(cle: string): StockageEtat {
  return {
    lire: () => {
      try {
        const v = JSON.parse(localStorage.getItem(cle) ?? 'null') as EtatEnregistre | null
        return v && typeof v.compte === 'number' && v.etat && typeof v.etat === 'object' ? v : null
      } catch { return null }
    },
    ecrire: v => { try { localStorage.setItem(cle, JSON.stringify(v)) } catch { /* stockage plein ou interdit */ } },
  }
}

/**
 * Lot 6 — garde les brouillons de l'appareil et ceux du serveur en accord tant qu'un compte
 * est connecté : à l'ouverture, au retour sur l'onglet, au retour du réseau et peu après
 * chaque saisie. Hors ligne, les brouillons restent sur l'appareil et partent plus tard.
 */
export function useSynchroBrouillons({ compte, api, magasins, stockage }: {
  compte: number | null | undefined
  api: ApiBrouillons
  magasins: readonly MagasinBrouillons[]
  stockage: StockageEtat
}): void {
  const deps = useRef({ api, magasins, stockage })
  useEffect(() => { deps.current = { api, magasins, stockage } })

  useEffect(() => {
    if (compte == null) return
    let actif = true
    let enCours: Promise<void> | null = null
    let aRelancer: boolean | null = null
    let minuteur: ReturnType<typeof setTimeout> | undefined

    const passe = async (complete: boolean): Promise<void> => {
      try {
        const r = await synchroniser({ compte, ...deps.current, complete })
        if (r.modifiesIci) window.dispatchEvent(new Event(EVENEMENT_BROUILLONS_SYNCHRONISES))
      } catch {
        // Serveur injoignable : les brouillons restent sur l'appareil, nouvel essai plus tard.
      }
    }
    const lancer = async (complete: boolean): Promise<void> => {
      if (!actif) return
      if (enCours) { aRelancer = aRelancer === true || complete; return }
      enCours = passe(complete)
      try { await enCours } finally {
        enCours = null
        if (aRelancer !== null) { const c = aRelancer; aRelancer = null; void lancer(c) }
      }
    }
    // Déconnexion : attendre la passe en cours, puis une passe complète.
    const forcer = async () => { if (enCours) await enCours; await passe(true) }
    passeForcee = forcer

    // Passe complète aussi après une saisie : elle propage les suppressions et ne remplace jamais
    // une version plus récente d'un autre appareil (la liste relue est légère, sans les données).
    const surSaisie = () => { clearTimeout(minuteur); minuteur = setTimeout(() => void lancer(true), DELAI_ENVOI_MS) }
    const surRetour = () => { if (document.visibilityState === 'visible') void lancer(true) }
    const surReseau = () => void lancer(true)

    void lancer(true)
    window.addEventListener(EVENEMENT_BROUILLONS_MODIFIES, surSaisie)
    document.addEventListener('visibilitychange', surRetour)
    window.addEventListener('online', surReseau)
    return () => {
      actif = false
      if (passeForcee === forcer) passeForcee = null
      clearTimeout(minuteur)
      window.removeEventListener(EVENEMENT_BROUILLONS_MODIFIES, surSaisie)
      document.removeEventListener('visibilitychange', surRetour)
      window.removeEventListener('online', surReseau)
    }
  }, [compte])
}

/** Compteur qui change à chaque modification ou synchronisation : pour relire une liste de brouillons. */
export function useVersionBrouillons(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const suivant = () => setVersion(v => v + 1)
    window.addEventListener(EVENEMENT_BROUILLONS_SYNCHRONISES, suivant)
    window.addEventListener(EVENEMENT_BROUILLONS_MODIFIES, suivant)
    return () => {
      window.removeEventListener(EVENEMENT_BROUILLONS_SYNCHRONISES, suivant)
      window.removeEventListener(EVENEMENT_BROUILLONS_MODIFIES, suivant)
    }
  }, [])
  return version
}

/**
 * Formulaire ouvert pendant qu'une version plus récente du même brouillon arrive d'un autre
 * appareil : `conflit` passe à vrai (le formulaire cesse d'écrire tant que l'utilisateur n'a
 * pas choisi entre cette version et sa saisie).
 */
export function useVersionDistante(estPlusRecente: () => boolean): { conflit: boolean; fermer: () => void } {
  const [conflit, setConflit] = useState(false)
  const verifier = useRef(estPlusRecente)
  useEffect(() => { verifier.current = estPlusRecente })
  useEffect(() => {
    const surSynchro = () => { if (verifier.current()) setConflit(true) }
    window.addEventListener(EVENEMENT_BROUILLONS_SYNCHRONISES, surSynchro)
    return () => window.removeEventListener(EVENEMENT_BROUILLONS_SYNCHRONISES, surSynchro)
  }, [])
  return { conflit, fermer: () => setConflit(false) }
}
