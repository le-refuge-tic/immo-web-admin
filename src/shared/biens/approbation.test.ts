import { describe, expect, it } from 'vitest'
import { manquesApprobation, photosDuBien, photosMinimumPourType } from './approbation'

const photo = (id: number) => ({ id, url: `https://x/${id}.jpg` })

describe('approbation : un seul comptage des photos, minimum par type', () => {
  it('photos du bien et des pièces, sans doublon (les photos de pièces portent aussi bien_id)', () => {
    const bien = { photos: [photo(1), photo(2)], pieces: [{ photos: [photo(2), photo(3)] }, { photos: [] }, {}] }
    expect(photosDuBien(bien).map(p => p.id)).toEqual([1, 2, 3])
    expect(photosDuBien({}).length).toBe(0)
    expect(photosDuBien({ pieces: [{ photos: [photo(9)] }] }).map(p => p.id)).toEqual([9])
  })

  it('minimum tiré du référentiel : 2 pour un bien classique, 4 pour guesthouse et salle', () => {
    expect(photosMinimumPourType('appart_vide')).toBe(2)
    expect(photosMinimumPourType('terrain')).toBe(2)
    expect(photosMinimumPourType('guesthouse')).toBe(4)
    expect(photosMinimumPourType('salle_fete')).toBe(4)
  })

  it('ce qui manque, avec les mêmes messages que l’API', () => {
    expect(manquesApprobation({ type: 'maison', photos: [photo(1)] })).toEqual(['au moins 2 photos (1 actuellement)'])
    expect(manquesApprobation({ type: 'maison', pieces: [{ photos: [photo(1), photo(2)] }] })).toEqual([])
    expect(manquesApprobation({ type: 'guesthouse', photos: [photo(1), photo(2), photo(3), photo(4)] }))
      .toEqual(['les détails guesthouse (à compléter dans « Modifier »)'])
    expect(manquesApprobation({ type: 'salle_fete', details_salle_fete: {}, photos: [] }))
      .toEqual(['au moins 4 photos (0 actuellement)'])
  })
})
