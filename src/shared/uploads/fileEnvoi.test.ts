import { describe, expect, it, vi } from 'vitest'
import { avancement, creerLot, executerLot, preparerReprise, type ElementEnvoi } from './fileEnvoi'

const fichier = (nom: string) => new File(['x'], nom, { type: 'image/jpeg' })
const sansPause = { pause: () => Promise.resolve() }

describe('file d’envoi des médias', () => {
  it('envoie la couverture seule, puis les autres photos, puis la vidéo', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 7, libelle: 'Villa', photos: ['1', '2', '3', '4'].map(fichier), video: new File(['v'], 'v.mp4') })
    const ordre: string[] = []
    let enVol = 0
    let maxEnVol = 0
    const envoyer = async (_id: number, el: ElementEnvoi) => {
      enVol++; maxEnVol = Math.max(maxEnVol, enVol)
      if (el.nom === '1') expect(enVol).toBe(1)
      await new Promise(r => setTimeout(r, 1))
      ordre.push(el.nom)
      enVol--
    }
    const fin = await executerLot(lot, envoyer, () => {}, sansPause)
    expect(ordre[0]).toBe('1')
    expect(ordre.at(-1)).toBe('v.mp4')
    expect(maxEnVol).toBe(2)
    expect(avancement(fin)).toEqual({ faits: 5, total: 5, echecs: 0, enCours: false })
  })

  it('réessaie 2 fois une erreur réseau, puis marque l’échec', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a')] })
    const envoyer = vi.fn().mockRejectedValue(new Error('Network Error'))
    const fin = await executerLot(lot, envoyer, () => {}, sansPause)
    expect(envoyer).toHaveBeenCalledTimes(3)
    expect(fin.elements[0]).toMatchObject({ statut: 'echec', erreur: 'Network Error' })
  })

  it('réussit au 2e essai après une erreur passagère', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a')] })
    const envoyer = vi.fn().mockRejectedValueOnce(new Error('timeout')).mockResolvedValue(undefined)
    const fin = await executerLot(lot, envoyer, () => {}, sansPause)
    expect(envoyer).toHaveBeenCalledTimes(2)
    expect(fin.elements[0].statut).toBe('ok')
  })

  it('ne réessaie pas un fichier refusé par l’API (400) et garde son message', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a')] })
    const envoyer = vi.fn().mockRejectedValue({ response: { status: 400, data: { message: '12 photos au maximum' } } })
    const fin = await executerLot(lot, envoyer, () => {}, sansPause)
    expect(envoyer).toHaveBeenCalledTimes(1)
    expect(fin.elements[0].erreur).toBe('12 photos au maximum')
  })

  it('ne modifie jamais le lot d’origine et notifie chaque changement', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a'), fichier('b')] })
    const maj = vi.fn()
    await executerLot(lot, () => Promise.resolve(), maj, sansPause)
    expect(lot.elements.every(e => e.statut === 'attente')).toBe(true)
    expect(maj.mock.calls.at(-1)?.[0].elements.every((e: ElementEnvoi) => e.statut === 'ok')).toBe(true)
  })

  it('reprise : seuls les éléments non envoyés repartent', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a'), fichier('b')] })
    const interrompu = { ...lot, elements: [{ ...lot.elements[0], statut: 'ok' as const }, { ...lot.elements[1], statut: 'en_cours' as const, essais: 1 }] }
    const envoyer = vi.fn().mockResolvedValue(undefined)
    await executerLot(preparerReprise(interrompu), envoyer, () => {}, sansPause)
    expect(envoyer).toHaveBeenCalledTimes(1)
    expect((envoyer.mock.calls[0][1] as ElementEnvoi).nom).toBe('b')
  })

  it('couverture refusée : les autres photos ne partent pas (elle reste la première)', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a'), fichier('b'), fichier('c')] })
    const envoyer = vi.fn().mockRejectedValue({ response: { status: 413 } })
    const fin = await executerLot(lot, envoyer, () => {}, sansPause)
    expect(envoyer).toHaveBeenCalledTimes(1)
    expect(fin.elements.map(e => e.statut)).toEqual(['echec', 'echec', 'echec'])
    const reprise = vi.fn().mockResolvedValue(undefined)
    await executerLot(preparerReprise(fin), reprise, () => {}, sansPause)
    expect((reprise.mock.calls[0][1] as ElementEnvoi).nom).toBe('a')
  })

  it('annulé (déconnexion) : plus aucun envoi', async () => {
    const lot = creerLot({ utilisateurId: 3, bienId: 1, libelle: 'X', photos: [fichier('a'), fichier('b')] })
    const envoyer = vi.fn().mockResolvedValue(undefined)
    await executerLot(lot, envoyer, () => {}, { ...sansPause, annule: () => true })
    expect(envoyer).not.toHaveBeenCalled()
  })
})
