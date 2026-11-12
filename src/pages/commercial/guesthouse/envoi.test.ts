import { beforeEach, describe, expect, it, vi } from 'vitest'

const create = vi.fn()
vi.mock('../../../api/guesthouse', () => ({ guesthouseApi: { create: (b: unknown) => create(b) } }))

const { envoyerGuesthouse } = await import('./envoi')

const photo = (n: string) => new File(['x'], n, { type: 'image/jpeg' })

describe('envoyerGuesthouse', () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue({ id: 42 })
  })

  it('crée le bien puis confie photos et vidéo au gestionnaire d’envois, dans l’ordre', async () => {
    const demarrer = vi.fn()
    const video = new File(['v'], 'v.mp4')
    const id = await envoyerGuesthouse({ a: 1 }, { libelle: 'Villa Fidjrossè', photos: [photo('1'), photo('2')], video }, demarrer)
    expect(create).toHaveBeenCalledWith({ a: 1 })
    expect(id).toBe(42)
    expect(demarrer).toHaveBeenCalledOnce()
    const demande = demarrer.mock.calls[0][0]
    expect(demande).toMatchObject({ bienId: 42, libelle: 'Villa Fidjrossè', lien: '/mes-annonces/42/modifier', video })
    expect(demande.photos.map((f: File) => f.name)).toEqual(['1', '2'])
  })

  it('échec de création : l’erreur remonte, aucun envoi démarré', async () => {
    create.mockRejectedValue(new Error('400'))
    const demarrer = vi.fn()
    await expect(envoyerGuesthouse({}, { libelle: 'X', photos: [photo('1')], video: null }, demarrer)).rejects.toThrow('400')
    expect(demarrer).not.toHaveBeenCalled()
  })
})
