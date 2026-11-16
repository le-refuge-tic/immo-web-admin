import { describe, expect, it } from 'vitest'
import { differencesModification, lisible } from './differencesModification'

const bien = {
  prix: '45000.00',
  description: 'Ancienne',
  localisation: { ville: 'Cotonou', quartier: 'Akpakpa' },
  amenites: { sous_type: 'chambre_salon', chambres: 1, standing: 'sanitaire' },
  pieces: [{ id: 1 }, { id: 2 }],
}

describe('différences d’une modification en attente', () => {
  it('ne liste que ce qui change, avec des libellés lisibles', () => {
    const d = differencesModification(bien, {
      prix: 50000,
      description: 'Ancienne',
      localisation: { ville: 'Cotonou', quartier: 'Fidjrossè' },
      amenites: { sous_type: 'chambre_salon', chambres: 2, standing: 'sanitaire' },
    })
    expect(d).toEqual([
      { champ: 'Prix', avant: lisible(45000), apres: lisible(50000) },
      { champ: 'Localisation · Quartier', avant: 'Akpakpa', apres: 'Fidjrossè' },
      { champ: 'Chambres', avant: '1', apres: '2' },
    ])
  })

  it('« 45000.00 » et 45000 sont égaux ; une valeur vidée apparaît en « — »', () => {
    expect(differencesModification(bien, { prix: 45000 })).toEqual([])
    expect(differencesModification({ prix_promo: 40000 }, { prix_promo: null })).toEqual([
      { champ: 'Prix promotionnel', avant: lisible(40000), apres: '—' },
    ])
  })

  it('pièces : nombre avant / après ; primes jamais affichées', () => {
    expect(differencesModification(bien, { pieces: [{}, {}, {}], amenites: { prime_validation_estimee: 9 } })).toEqual([
      { champ: 'Pièces', avant: '2', apres: '3' },
    ])
  })

  it('détails guesthouse comparés champ par champ', () => {
    expect(differencesModification({ details_guesthouse: { prix_nuitee: 25000 } }, { details_guesthouse: { prix_nuitee: 30000 } }))
      .toEqual([{ champ: 'Détails · Prix par nuit', avant: lisible(25000), apres: lisible(30000) }])
  })

  it('équipements et événements comparés aux listes du bien, sans tenir compte de l’ordre', () => {
    const enLigne = { equipements_liste: [{ code: 'wifi' }, { code: 'climatisation' }], evenements: [{ code: 'mariage' }] }
    expect(differencesModification(enLigne, { equipements: ['climatisation', 'wifi'], evenements: ['mariage'] })).toEqual([])
    expect(differencesModification(enLigne, { equipements: ['wifi'] })).toEqual([
      { champ: 'Équipements', avant: 'climatisation, wifi', apres: 'wifi' },
    ])
  })
})
