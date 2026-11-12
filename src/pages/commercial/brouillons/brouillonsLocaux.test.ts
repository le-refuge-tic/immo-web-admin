import { describe, expect, it } from 'vitest'
import {
  BROUILLONS_MAX, enregistrerBrouillon, libelleParNom, lireBrouillon, listerBrouillons,
  supprimerBrouillon, tousLesBrouillons, type Stockage,
} from './brouillonsLocaux'

function stockage(init: Record<string, string> = {}): Stockage & { donnees: Record<string, string> } {
  const donnees = { ...init }
  return {
    donnees,
    getItem: k => donnees[k] ?? null,
    setItem: (k, v) => { donnees[k] = v },
    removeItem: k => { delete donnees[k] },
  }
}

type Form = { nom: string; prix?: string }
const libelle = libelleParNom('guesthouse')
const brouillon = (id: string, nom: string, updatedAt: number) =>
  ({ id, famille: 'guesthouse' as const, libelle: libelle({ nom }), etape: 2, updatedAt, donnees: { nom } })

describe('brouillons locaux', () => {
  it('plusieurs brouillons par type, du plus récent au plus ancien, libellé tiré du nom', () => {
    const s = stockage()
    enregistrerBrouillon<Form>(brouillon('a', 'Villa Fidjrossè', 1), libelle, s)
    enregistrerBrouillon<Form>(brouillon('b', '', 2), libelle, s)
    const liste = listerBrouillons<Form>('guesthouse', libelle, s)
    expect(liste.map(b => [b.id, b.libelle])).toEqual([['b', 'Guesthouse'], ['a', 'Villa Fidjrossè']])
  })

  it('enregistrer le même id remplace le brouillon (pas de doublon)', () => {
    const s = stockage()
    enregistrerBrouillon<Form>(brouillon('a', 'V1', 1), libelle, s)
    enregistrerBrouillon<Form>({ ...brouillon('a', 'V2', 5), etape: 3 }, libelle, s)
    const liste = listerBrouillons<Form>('guesthouse', libelle, s)
    expect(liste).toHaveLength(1)
    expect(liste[0]).toMatchObject({ libelle: 'V2', etape: 3, updatedAt: 5 })
  })

  it('l’ancien brouillon unique (sans date, mauvais libellé) est repris une fois', () => {
    const s = stockage({ publier_guesthouse_draft: JSON.stringify({ form: { nom: 'Les Palmiers' }, etape: 3 }) })
    const liste = listerBrouillons<Form>('guesthouse', libelle, s)
    expect(liste).toHaveLength(1)
    expect(liste[0]).toMatchObject({ libelle: 'Les Palmiers', etape: 3 })
    expect(liste[0].updatedAt).toBeGreaterThan(0)
    expect(s.donnees.publier_guesthouse_draft).toBeUndefined()
    expect(listerBrouillons<Form>('guesthouse', libelle, s)).toHaveLength(1)
  })

  it('lire et supprimer un brouillon précis', () => {
    const s = stockage()
    enregistrerBrouillon<Form>(brouillon('a', 'A', 1), libelle, s)
    enregistrerBrouillon<Form>(brouillon('b', 'B', 2), libelle, s)
    expect(lireBrouillon<Form>('guesthouse', 'a', libelle, s)?.libelle).toBe('A')
    supprimerBrouillon('guesthouse', 'a', s)
    expect(listerBrouillons<Form>('guesthouse', libelle, s).map(b => b.id)).toEqual(['b'])
    expect(lireBrouillon<Form>('guesthouse', 'inconnu', libelle, s)).toBeNull()
  })

  it(`au plus ${BROUILLONS_MAX} brouillons par type : les plus anciens sont oubliés`, () => {
    const s = stockage()
    for (let i = 0; i < BROUILLONS_MAX + 3; i++) enregistrerBrouillon<Form>(brouillon(`id${i}`, `N${i}`, i), libelle, s)
    const liste = listerBrouillons<Form>('guesthouse', libelle, s)
    expect(liste).toHaveLength(BROUILLONS_MAX)
    expect(liste.at(-1)?.id).toBe('id3')
  })

  it('stockage illisible : liste vide, sans erreur', () => {
    expect(listerBrouillons<Form>('salle_fete', libelleParNom('salle_fete'), stockage({ publier_salle_fete_drafts: '{oups' }))).toEqual([])
  })

  it('« Mes annonces » : toutes familles, liens vers le bon brouillon', () => {
    const s = stockage({
      publier_bien_drafts: JSON.stringify([{ id: 'c1', label: 'Chambre Akpakpa', updatedAt: 3, step: 1 }]),
      publier_salle_fete_draft: JSON.stringify({ form: { nom: 'Salle Cocotiers' }, etape: 1 }),
    })
    enregistrerBrouillon<Form>(brouillon('g1', 'Villa', 2), libelle, s)
    const tous = tousLesBrouillons(s)
    expect(tous.map(b => [b.famille, b.libelle])).toEqual([
      ['salle_fete', 'Salle Cocotiers'], ['bien', 'Chambre Akpakpa'], ['guesthouse', 'Villa'],
    ])
    expect(tous.find(b => b.id === 'g1')?.lien).toBe('/publier-guesthouse?draft=g1')
    expect(tous.find(b => b.id === 'c1')?.lien).toBe('/publier-bien?draft=c1')
  })
})
