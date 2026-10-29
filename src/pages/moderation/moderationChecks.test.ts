import { describe, expect, it } from 'vitest'
import { blocageApprobation, moderationChecks, formatPrix, TYPE_LABELS } from './moderationChecks'

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

describe('modération salle de fêtes', () => {
  it('salle sans détails : approbation bloquée avec le motif', () => {
    expect(blocageApprobation({ type: 'salle_fete', details_salle_fete: null, photos: photos(5) })).toMatch(/détails de la salle/i)
  })
  it('salle avec moins de 4 photos : bloquée, avec le compte actuel', () => {
    expect(blocageApprobation({ type: 'salle_fete', details_salle_fete: {}, photos: photos(3) })).toMatch(/4 photos \(3 actuellement\)/)
  })
  it('sans détails ET sans photos : les deux manques sont signalés', () => {
    const motif = blocageApprobation({ type: 'salle_fete', details_salle_fete: null, photos: [] }) ?? ''
    expect(motif).toMatch(/détails de la salle/i)
    expect(motif).toMatch(/4 photos/)
  })
  it('salle complète : non bloquée', () => {
    expect(blocageApprobation({ type: 'salle_fete', details_salle_fete: {}, photos: photos(4) })).toBeNull()
  })
  it('les détails d’une guesthouse ne suffisent pas pour une salle, et inversement', () => {
    expect(blocageApprobation({ type: 'salle_fete', details_guesthouse: {}, photos: photos(4) })).not.toBeNull()
    expect(blocageApprobation({ type: 'guesthouse', details_salle_fete: {}, photos: photos(4) })).not.toBeNull()
  })
  it('contrôles : la salle ajoute « détails » et « 4 photos », la guesthouse garde les siens', () => {
    const labels = moderationChecks({ type: 'salle_fete', details_salle_fete: null, photos: photos(2) }).map(c => c.label).join(' | ')
    expect(labels).toMatch(/Détails de la salle manquants/)
    expect(labels).toMatch(/4 photos/)
    expect(moderationChecks({ type: 'salle_fete', details_salle_fete: {}, photos: photos(4) }).map(c => c.label).join(' | '))
      .toMatch(/Détails de la salle renseignés/)
    expect(moderationChecks({ type: 'salle_fete', photos: [] })).toHaveLength(7)
  })
  it('prix : à l’heure, jamais « /mois »', () => {
    const p = formatPrix({ type: 'salle_fete', transaction: 'location', prix: 45000, unite_prix: 'heure', details_salle_fete: { duree_heures: 8 } })
    expect(p).toContain('/8h')
    expect(p).not.toContain('mois')
  })
  it('libellé du type', () => {
    expect(TYPE_LABELS.salle_fete).toBe('Salle de fêtes')
  })
})
