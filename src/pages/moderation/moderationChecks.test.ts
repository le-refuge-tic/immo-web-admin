import { describe, expect, it } from 'vitest'
import { blocageApprobation, moderationChecks, formatPrix } from './moderationChecks'

const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ url: `p${i}` }))

describe('modération guesthouse', () => {
  it('guesthouse sans détails : approbation bloquée avec le motif', () => {
    expect(blocageApprobation({ type: 'guesthouse', details_guesthouse: null, photos: photos(5) })).toMatch(/détails/i)
  })
  it('guesthouse avec moins de 4 photos : bloquée', () => {
    expect(blocageApprobation({ type: 'guesthouse', details_guesthouse: {}, photos: photos(3) })).toMatch(/4 photos/)
  })
  it('guesthouse complète : non bloquée', () => {
    expect(blocageApprobation({ type: 'guesthouse', details_guesthouse: {}, photos: photos(4) })).toBeNull()
  })
  it('non-régression : un appartement n’est jamais bloqué par ces règles', () => {
    expect(blocageApprobation({ type: 'appart_vide', photos: [] })).toBeNull()
  })
  it('contrôles : la guesthouse ajoute « détails » et « 4 photos »', () => {
    const labels = moderationChecks({ type: 'guesthouse', details_guesthouse: null, photos: photos(2) }).map(c => c.label).join(' | ')
    expect(labels).toMatch(/Détails guesthouse/)
    expect(labels).toMatch(/4 photos/)
    expect(moderationChecks({ type: 'appart_vide', photos: [] })).toHaveLength(5)
  })
  it('prix : par nuit pour une guesthouse, par mois pour une location', () => {
    expect(formatPrix({ type: 'guesthouse', transaction: 'location', prix: 25000, unite_prix: 'nuit' })).toContain('/nuit')
    expect(formatPrix({ type: 'appart_vide', transaction: 'location', prix: 30000 })).toContain('/mois')
  })
})
