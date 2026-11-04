import { describe, it, expect } from 'vitest'
import { categorieCommerciale, primeValidationCommerciale } from './commissionCommerciale'

const M = 1_000_000
// Mêmes cas que immo-backend/src/users/portefeuille-commercial.util.spec.ts (grille partagée).
const CAS: [string, string, string | null, string, number, Record<string, unknown>, string, number][] = [
  ['entrée-coucher', 'appart_vide', 'entree_coucher', 'location', 25000, {}, 'chambre_simple', 1000],
  ['entrée-coucher meublée', 'appart_meuble', 'entree_coucher', 'location', 40000, { meuble: true }, 'chambre_simple', 1500],
  ['chambre-salon', 'appart_vide', 'chambre_salon', 'location', 40000, { chambres: 1 }, 'chambre_salon', 1000],
  ['appartement 1 chambre', 'appart_vide', 'appartement', 'location', 60000, { chambres: 1 }, 'appart_2p', 1500],
  ['appartement 2 chambres', 'appart_vide', 'appartement', 'location', 80000, { chambres: 2 }, 'appart_3p', 2000],
  ['appartement 1 chambre meublé', 'appart_meuble', 'appart_meuble', 'location', 120000, { chambres: 1 }, 'appart_2p', 2000],
  ['appartement 3 chambres meublé', 'appart_meuble', 'appart_meuble', 'location', 250000, { chambres: 3, meuble: true }, 'appart_3p', 2500],
  ['villa meublée', 'maison', 'villa', 'location', 500000, { meuble: true }, 'villa_maison', 2500],
  ['villa meublée en finition', 'maison', 'villa', 'location', 500000, { meuble: true, disponibilite: 'en_finition' }, 'villa_maison', 2000],
  ['duplex', 'maison', 'duplex', 'location', 400000, {}, 'villa_maison', 2000],
  ['maison individuelle', 'maison', 'maison_individuelle', 'location', 150000, {}, 'villa_maison', 2000],
  ['boutique meublée', 'maison', 'boutique', 'location', 50000, { meuble: true }, 'boutique', 1000],
  ['guesthouse', 'guesthouse', null, 'location', 25000, {}, 'local_commercial', 2000],
  ['salle de fêtes meublée', 'salle_fete', null, 'location', 150000, { meuble: true }, 'salle_fete', 2000],
  ['terrain en location', 'terrain', 'terrain', 'location', 50000, {}, 'terrain_location', 2000],
  ['terrain 3 M', 'terrain', 'terrain', 'vente', 3 * M, {}, 'vente_terrain', 1500],
  ['terrain 10 M', 'terrain', 'terrain', 'vente', 10 * M, {}, 'vente_terrain', 3000],
  ['terrain 25 M', 'terrain', 'terrain', 'vente', 25 * M, {}, 'vente_terrain', 5000],
  ['terrain 40 M', 'terrain', 'terrain', 'vente', 40 * M, {}, 'vente_terrain', 7500],
  ['boutique à vendre 15 M', 'maison', 'boutique', 'vente', 15 * M, {}, 'vente_bati', 3000],
  ['villa à vendre 15 M', 'maison', 'villa', 'vente', 15 * M, {}, 'vente_bati', 3000],
  ['villa à vendre 20 M', 'maison', 'villa', 'vente', 20 * M, {}, 'vente_bati', 5000],
  ['duplex à vendre 80 M', 'maison', 'duplex', 'vente', 80 * M, {}, 'vente_bati', 7500],
  ['appartement meublé à vendre 15 M', 'appart_meuble', 'appart_meuble', 'vente', 15 * M, { meuble: true }, 'vente_bati', 3000],
]

describe('primeValidationCommerciale — même grille que le serveur', () => {
  it.each(CAS)('%s', (_n, type, st, tr, prix, am, categorie, prime) => {
    expect(categorieCommerciale(type, st, tr, prix, am).cle).toBe(categorie)
    expect(primeValidationCommerciale(type, st, tr, prix, am)).toBe(prime)
  })
})
