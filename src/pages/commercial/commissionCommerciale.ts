/**
 * Estimation de la prime de validation affichée au commercial avant publication.
 * Portage EXACT de la grille du serveur (immo-backend, users/portefeuille-commercial.util.ts) :
 * toute modification doit être faite des deux côtés, avec les mêmes cas de test.
 * Prime de base de la catégorie + supplément meublé ; la majoration du 11e bien et le
 * plafond de la semaine dépendent des autres biens validés et ne sont pas estimés ici.
 */
const M = 1_000_000
const SUPPLEMENT_MEUBLE = 500

type Categorie = { cle: string; prime: number; meublable: boolean }

const SOUS_TYPES_VILLA = ['villa', 'maison', 'maison_individuelle', 'duplex', 'grande_propriete', 'grande propriété', 'grande_propriété']

const trancheVenteTerrain = (v: number) => (v <= 3 * M ? 1500 : v <= 10 * M ? 3000 : v <= 25 * M ? 5000 : 7500)
const trancheVenteBati = (v: number) => (v < 20 * M ? 3000 : v <= 50 * M ? 5000 : 7500)
const cat = (cle: string, prime: number, meublable = false): Categorie => ({ cle, prime, meublable })

export function categorieCommerciale(
  type: string,
  sousType: string | null | undefined,
  transaction: string,
  prix: number,
  amenites: Record<string, unknown>,
): Categorie {
  const t = (type ?? '').toLowerCase()
  const s = String(sousType ?? amenites.sous_type ?? '').toLowerCase()
  const vente = (transaction ?? 'location').toLowerCase() === 'vente'
  const p = Number(prix ?? 0)

  if (t === 'terrain') return vente ? cat('vente_terrain', trancheVenteTerrain(p)) : cat('terrain_location', 2000)
  if (t === 'guesthouse') return cat('local_commercial', 2000)
  if (t === 'salle_fete') return cat('salle_fete', 2000)
  if (vente) {
    if (['complexe', 'rapport', 'immeuble'].some(m => s.includes(m))) return cat('vente_immeuble', p < 10 * M ? 6000 : 10000)
    return cat('vente_bati', trancheVenteBati(p))
  }
  if (s === 'boutique') return cat('boutique', 1000)
  if (s === 'bureau') return cat('bureau', 1500)
  if (s === 'local_commercial' || s === 'showroom' || s === 'guesthouse') return cat('local_commercial', 2000)
  if (s === 'entrepot' || s === 'entrepôt') return cat('entrepot', 2000)
  if (SOUS_TYPES_VILLA.includes(s) || (!s && t === 'maison')) return cat('villa_maison', 2000, true)
  if (s === 'chambre_salon' || s === 'studio') return cat('chambre_salon', 1000, true)
  if (s === 'entree_coucher' || s === 'chambre' || s === 'chambre_simple') return cat('chambre_simple', 1000, true)
  if (s.includes('appartement') || s.startsWith('appart') || (!s && (t === 'appart_vide' || t === 'appart_meuble'))) {
    const chambres = Number(amenites.chambres ?? 0)
    const standing = String(amenites.standing ?? '').toLowerCase()
    const hautStanding = ['haut_standing_vip', 'sanitaire_staffe', 'sanitaire_semi_staffe'].includes(standing)
    return chambres >= 2 || hautStanding ? cat('appart_3p', 2000, true) : cat('appart_2p', 1500, true)
  }
  return cat('logement', 1000, true)
}

export function primeValidationCommerciale(
  type: string,
  sousType: string | null | undefined,
  transaction: string,
  prix: number,
  amenites: Record<string, unknown>,
): number {
  const c = categorieCommerciale(type, sousType, transaction, prix, amenites)
  const meuble = amenites.meuble === true || amenites.tarifs_meuble != null ||
    type === 'appart_meuble' || (sousType ?? amenites.sous_type) === 'appart_meuble'
  const supplement = c.meublable && amenites.disponibilite !== 'en_finition' && meuble ? SUPPLEMENT_MEUBLE : 0
  return c.prime + supplement
}
