import type { WalletTransaction } from '../../api/getWallet'

export type GenreMouvement = 'prime' | 'resultat' | 'regularisation' | 'bonus' | 'retrait' | 'remboursement' | 'credit'

/** Une ligne d'historique du portefeuille, expliquée pour le commercial. */
export type Explication = {
  genre: GenreMouvement
  titre: string
  /** Détail du calcul, une ligne par élément (prime, meublé, majoration, plafond…). */
  details: string[]
  /** Montant signé : positif pour un crédit, négatif pour un retrait. */
  montant: number
}

export const formatFcfa = (v: number) =>
  `${String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`

const rang = (n: number) => (n === 1 ? '1er' : `${n}e`)

/** Binôme : rappel du pot partagé 50/50 et de la part reçue. */
function partBinome(m: Record<string, any>, montant: number): string {
  const qui = m.auteur === false ? 'bien publié par votre binôme' : 'bien publié par vous'
  const pot = Number(m.montant_pot ?? m.montant_prime ?? montant * 2)
  return `Binôme (${qui}) : pot de ${formatFcfa(pot)} partagé 50/50, votre part ${formatFcfa(montant)}`
}

function explicationPrime(t: WalletTransaction, m: Record<string, any>): Explication {
  const bien = m.bien_id ? `bien #${m.bien_id}` : 'bien'
  const montant = Number(t.amount)
  // Crédit antérieur au détail par catégorie (avant le 04/11/2026) : seul le résultat est connu.
  if (!m.categorie) {
    return {
      genre: 'prime',
      titre: `Prime de validation — ${bien}`,
      details: [
        m.rang_semaine ? `${rang(Number(m.rang_semaine))} bien validé de la semaine` : '',
        'Calculée avec l’ancienne grille (avant le 4 novembre 2026)',
      ].filter(Boolean),
      montant,
    }
  }
  const details = [`${m.categorie_libelle} : prime ${formatFcfa(Number(m.prime_bien))}`]
  if (Number(m.bonus_meuble) > 0) details.push(`Logement meublé : +${formatFcfa(Number(m.bonus_meuble))}`)
  if (Number(m.bonus_11e_bien) > 0) {
    details.push(
      `${rang(Number(m.rang_categorie))} bien de cette catégorie cette semaine (dès le 11e : +50 %) : +${formatFcfa(Number(m.bonus_11e_bien))}`,
    )
  }
  if (m.plafond_exceptionnel) {
    details.push(
      `${rang(Number(m.rang_semaine))} bien validé de la semaine${m.pot_equipe ? ' (binôme)' : ''} : palier de ${Number(m.seuil_palier ?? 20)} biens atteint, semaine ${m.pot_equipe ? 'de la paire ' : ''}portée à 50 000 FCFA (crédit ${formatFcfa(m.pot_equipe ? Number(m.montant_pot) : montant)})`,
    )
  } else if (m.rang_semaine) {
    details.push(`${rang(Number(m.rang_semaine))} bien validé de la semaine`)
  }
  if (m.pot_equipe) details.push(partBinome(m, montant))
  return { genre: 'prime', titre: `Prime de validation — ${bien}`, details, montant }
}

/** Titre et détail d'un mouvement du portefeuille commercial. */
export function expliquerMouvement(t: WalletTransaction): Explication {
  const m = t.metadata ?? {}
  const montant = Number(t.amount)
  if (t.type === 'retrait') {
    return {
      genre: 'retrait',
      titre: 'Retrait',
      details: ['Montant réservé dès la demande ; son état est suivi dans « Mes retraits ».'],
      montant: -montant,
    }
  }
  if (m.type === 'portefeuille_validation') return explicationPrime(t, m)
  if (m.type === 'prime_resultat') {
    const verbe = m.nature === 'vente' ? 'vendu' : 'loué'
    const details = [
      `Bien ${verbe}${m.date_conclusion ? ` le ${new Date(m.date_conclusion).toLocaleDateString('fr-FR')}` : ''}`,
      `Commission encaissée par Refuge : ${formatFcfa(Number(m.commission))}`,
      `10 % de la commission : ${formatFcfa(Number(m.montant_prime))}`,
    ]
    if (m.pot_equipe) details.push(partBinome(m, montant))
    return { genre: 'resultat', titre: `Prime de résultat — bien #${m.bien_id}`, details, montant }
  }
  if (m.type === 'regularisation') {
    return {
      genre: 'regularisation',
      titre: `Régularisation — bien #${m.bien_id}`,
      details: [
        'Prime recalculée avec la grille du 4 novembre 2026',
        `${m.categorie_libelle ?? 'Catégorie'} : dû ${formatFcfa(Number(m.montant_du))}`,
        `Déjà reçu : ${formatFcfa(Number(m.montant_credite))}`,
        `Complément versé : ${formatFcfa(montant)}`,
      ],
      montant,
    }
  }
  if (m.type === 'bonus_admin') {
    return {
      genre: 'bonus',
      titre: 'Bonus accordé par l’équipe Refuge',
      details: [m.motif ? `Motif : ${m.motif}` : t.description],
      montant,
    }
  }
  if (m.type === 'remboursement_retrait' || /retrait|virement/i.test(t.description ?? '')) {
    return {
      genre: 'remboursement',
      titre: 'Retrait annulé — montant rendu',
      details: [t.description],
      montant,
    }
  }
  return { genre: 'credit', titre: 'Crédit', details: [t.description], montant }
}
