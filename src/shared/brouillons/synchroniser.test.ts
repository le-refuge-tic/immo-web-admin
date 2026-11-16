import { describe, expect, it, vi } from 'vitest'
import type { EntreeBrouillon, ResumeServeur } from './planSynchro'
import { synchroniser, type ApiBrouillons, type EtatEnregistre, type MagasinBrouillons } from './synchroniser'

type Distant = ResumeServeur & { donnees: Record<string, unknown> }

function magasin(famille: string, initiaux: EntreeBrouillon[] = []): MagasinBrouillons & { contenu: Map<string, EntreeBrouillon> } {
  const contenu = new Map(initiaux.map(e => [e.cle, e]))
  return {
    contenu,
    familles: [famille],
    lire: () => [...contenu.values()],
    ecrire: e => { contenu.set(e.cle, e) },
    retirer: cle => { contenu.delete(cle) },
    vider: () => contenu.clear(),
  }
}

function serveur(initiaux: Distant[] = []): ApiBrouillons & { contenu: Map<string, Distant> } {
  const contenu = new Map(initiaux.map(d => [d.cle, d]))
  return {
    contenu,
    lister: vi.fn(async () => [...contenu.values()].map(d => ({ cle: d.cle, famille: d.famille, libelle: d.libelle, etape: d.etape, maj_le: d.maj_le }))),
    lire: vi.fn(async (cle: string) => { const d = contenu.get(cle); if (!d) throw new Error('404'); return d }),
    enregistrer: vi.fn(async (e: EntreeBrouillon) => {
      const d = contenu.get(e.cle)
      if (d && d.maj_le > e.majLe) return { maj_le: d.maj_le, applique: false }
      contenu.set(e.cle, { cle: e.cle, famille: e.famille, libelle: e.libelle, etape: e.etape, maj_le: e.majLe, donnees: e.donnees })
      return { maj_le: e.majLe, applique: true }
    }),
    supprimer: vi.fn(async (cle: string) => { contenu.delete(cle) }),
  }
}

function stockage(initial: EtatEnregistre | null = null) {
  let v = initial
  return { lire: () => v, ecrire: (n: EtatEnregistre) => { v = n }, get valeur() { return v } }
}

const entree = (cle: string, majLe: number, famille = 'guesthouse'): EntreeBrouillon => ({ cle, famille, libelle: cle, etape: 1, majLe, donnees: { nom: cle } })
const distant = (cle: string, maj_le: number, famille = 'guesthouse'): Distant => ({ cle, famille, libelle: cle, etape: 2, maj_le, donnees: { nom: `${cle} serveur` } })

describe('synchronisation des brouillons', () => {
  it('premier passage : envoie les brouillons locaux, récupère ceux d’un autre appareil', async () => {
    const gh = magasin('guesthouse', [entree('a', 10)])
    const api = serveur([distant('b', 20)])
    const s = stockage()
    const r = await synchroniser({ compte: 7, api, magasins: [gh], stockage: s, complete: true })
    expect(api.contenu.has('a')).toBe(true)
    expect(gh.contenu.get('b')?.donnees).toEqual({ nom: 'b serveur' })
    expect(r).toEqual({ modifiesIci: true, echecs: 0 })
    expect(s.valeur).toEqual({ compte: 7, etat: { a: 10, b: 20 } })
  })

  it('suppression ici puis synchro : supprimé du serveur ; suppression ailleurs : retiré ici', async () => {
    const gh = magasin('guesthouse', [entree('garde', 5)])
    const api = serveur([distant('supprime-ici', 10), distant('garde', 5)])
    await synchroniser({ compte: 7, api, magasins: [gh], stockage: stockage({ compte: 7, etat: { 'supprime-ici': 10, garde: 5 } }), complete: true })
    expect(api.contenu.has('supprime-ici')).toBe(false)

    api.contenu.delete('garde')
    await synchroniser({ compte: 7, api, magasins: [gh], stockage: stockage({ compte: 7, etat: { garde: 5 } }), complete: true })
    expect(gh.contenu.has('garde')).toBe(false)
  })

  it('autre compte sur ce navigateur : ses brouillons locaux ne sont jamais envoyés', async () => {
    const gh = magasin('guesthouse', [entree('a-l-autre', 10)])
    const api = serveur()
    const r = await synchroniser({ compte: 8, api, magasins: [gh], stockage: stockage({ compte: 7, etat: { 'a-l-autre': 10 } }), complete: true })
    expect(api.contenu.size).toBe(0)
    expect(gh.contenu.size).toBe(0)
    expect(r.modifiesIci).toBe(true)
  })

  it('envoi rapide : seulement les saisies récentes, sans relire la liste', async () => {
    const gh = magasin('guesthouse', [entree('a', 10), entree('b', 30)])
    const api = serveur()
    await synchroniser({ compte: 7, api, magasins: [gh], stockage: stockage({ compte: 7, etat: { a: 10, b: 20 } }), complete: false })
    expect(api.lister).not.toHaveBeenCalled()
    expect(api.enregistrer).toHaveBeenCalledTimes(1)
    expect([...api.contenu.keys()]).toEqual(['b'])
  })

  it('version plus récente sur le serveur pendant l’envoi : c’est elle qui est gardée ici', async () => {
    const gh = magasin('guesthouse', [entree('a', 10)])
    const api = serveur([distant('a', 50)])
    await synchroniser({ compte: 7, api, magasins: [gh], stockage: stockage({ compte: 7, etat: {} }), complete: false })
    expect(gh.contenu.get('a')?.majLe).toBe(50)
  })

  it('un échec n’empêche pas les autres opérations ; famille inconnue ignorée', async () => {
    const gh = magasin('guesthouse', [entree('a', 10), entree('b', 10)])
    const api = serveur([distant('inconnue', 5, 'autre_espace')])
    api.enregistrer = vi.fn(async (e: EntreeBrouillon) => {
      if (e.cle === 'a') throw new Error('réseau')
      return { maj_le: e.majLe, applique: true }
    })
    const s = stockage()
    const r = await synchroniser({ compte: 7, api, magasins: [gh], stockage: s, complete: true })
    expect(r.echecs).toBe(1)
    expect(s.valeur?.etat).toEqual({ b: 10 })
  })
})
