import { describe, expect, it } from 'vitest'
import { aEnvoyer, planifierSynchro, type EntreeBrouillon, type ResumeServeur } from './planSynchro'

const ici = (cle: string, majLe: number): EntreeBrouillon => ({ cle, famille: 'guesthouse', libelle: cle, etape: 0, majLe, donnees: {} })
const serveur = (cle: string, maj_le: number): ResumeServeur => ({ cle, famille: 'guesthouse', libelle: cle, etape: 0, maj_le })
const cles = (l: { cle: string }[]) => l.map(x => x.cle)

describe('plan de synchronisation des brouillons', () => {
  it('le plus récent l’emporte ; égalité : rien à faire', () => {
    const p = planifierSynchro([ici('a', 20), ici('b', 10), ici('c', 5)], [serveur('a', 10), serveur('b', 20), serveur('c', 5)], { a: 10, b: 10, c: 5 })
    expect(cles(p.envoyer)).toEqual(['a'])
    expect(cles(p.recuperer)).toEqual(['b'])
    expect(p.retirerIci).toEqual([])
    expect(p.supprimerServeur).toEqual([])
  })

  it('jamais synchronisé : envoyé ; créé sur un autre appareil : récupéré', () => {
    const p = planifierSynchro([ici('nouveau', 1)], [serveur('ailleurs', 3)], {})
    expect(cles(p.envoyer)).toEqual(['nouveau'])
    expect(cles(p.recuperer)).toEqual(['ailleurs'])
  })

  it('supprimé sur un autre appareil : retiré ici, sauf saisie plus récente ici (renvoyée)', () => {
    const p = planifierSynchro([ici('a', 10)], [], { a: 10 })
    expect(cles(p.retirerIci)).toEqual(['a'])
    expect(p.envoyer).toEqual([])
    const modifieIci = planifierSynchro([ici('a', 25)], [], { a: 10 })
    expect(modifieIci.retirerIci).toEqual([])
    expect(cles(modifieIci.envoyer)).toEqual(['a'])
  })

  it('supprimé ici : supprimé du serveur, sauf s’il y a été modifié depuis', () => {
    expect(planifierSynchro([], [serveur('a', 10)], { a: 10 }).supprimerServeur).toEqual([{ cle: 'a', majLe: 10 }])
    const modifieAilleurs = planifierSynchro([], [serveur('a', 30)], { a: 10 })
    expect(modifieAilleurs.supprimerServeur).toEqual([])
    expect(cles(modifieAilleurs.recuperer)).toEqual(['a'])
  })

  it('envoi rapide : seulement ce qui a changé depuis la dernière synchro', () => {
    expect(cles(aEnvoyer([ici('a', 10), ici('b', 15), ici('c', 1)], { a: 10, b: 12 }))).toEqual(['b', 'c'])
  })
})
