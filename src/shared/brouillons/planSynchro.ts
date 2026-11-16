/**
 * Lot 6 — synchronisation des brouillons entre l'appareil (cache, hors ligne) et le serveur.
 * Logique pure, testée dans planSynchro.test.ts. Code partagé : identique dans les deux fronts.
 *
 * `etat[cle]` retient la date (maj_le) de la dernière version connue des deux côtés. Il permet
 * de distinguer, sans liste de suppressions :
 * - un brouillon absent du serveur mais déjà synchronisé → supprimé ailleurs : on le retire ici ;
 * - un brouillon absent d'ici mais pas modifié sur le serveur depuis → supprimé ici : on le
 *   supprime du serveur.
 */

/** Brouillon tel que l'appareil le connaît (toutes familles confondues). */
export interface EntreeBrouillon {
  cle: string
  famille: string
  libelle: string
  etape: number
  /** Date de la dernière saisie (ms). */
  majLe: number
  donnees: Record<string, unknown>
}

/** Résumé renvoyé par GET /brouillons-biens. */
export interface ResumeServeur {
  cle: string
  famille: string
  libelle: string
  etape: number
  maj_le: number
}

export type EtatSynchro = Record<string, number>

export interface PlanSynchro {
  /** Plus récents ici, ou jamais envoyés. */
  envoyer: EntreeBrouillon[]
  /** Plus récents sur le serveur, ou créés sur un autre appareil. */
  recuperer: ResumeServeur[]
  /** Supprimés sur un autre appareil. */
  retirerIci: EntreeBrouillon[]
  /** Supprimés sur cet appareil. */
  supprimerServeur: string[]
}

export function planifierSynchro(ici: readonly EntreeBrouillon[], serveur: readonly ResumeServeur[], etat: EtatSynchro): PlanSynchro {
  const plan: PlanSynchro = { envoyer: [], recuperer: [], retirerIci: [], supprimerServeur: [] }
  const distants = new Map(serveur.map(s => [s.cle, s]))
  const locaux = new Map(ici.map(e => [e.cle, e]))

  for (const e of ici) {
    const s = distants.get(e.cle)
    if (s) {
      if (e.majLe > s.maj_le) plan.envoyer.push(e)
      else if (s.maj_le > e.majLe) plan.recuperer.push(s)
    } else if (etat[e.cle] !== undefined) {
      plan.retirerIci.push(e)
    } else {
      plan.envoyer.push(e)
    }
  }
  for (const s of serveur) {
    if (locaux.has(s.cle)) continue
    const connu = etat[s.cle]
    if (connu !== undefined && s.maj_le <= connu) plan.supprimerServeur.push(s.cle)
    else plan.recuperer.push(s)
  }
  return plan
}

/** Envoi rapide après une saisie (sans relire le serveur) : ce qui a changé depuis la dernière synchro. */
export function aEnvoyer(ici: readonly EntreeBrouillon[], etat: EtatSynchro): EntreeBrouillon[] {
  return ici.filter(e => etat[e.cle] === undefined || e.majLe > etat[e.cle])
}
