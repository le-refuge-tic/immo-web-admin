import { beforeEach, describe, expect, it, vi } from 'vitest'

const create = vi.fn()
const uploadPhoto = vi.fn()
const uploadVideo = vi.fn()
vi.mock('../../../api/guesthouse', () => ({ guesthouseApi: { create: (b: unknown) => create(b) } }))
vi.mock('../../../api/postBien', () => ({
  postBien: {
    uploadPhoto: (id: number, f: File) => uploadPhoto(id, f),
    uploadVideo: (id: number, f: File) => uploadVideo(id, f),
  },
}))

const { envoyerGuesthouse } = await import('./envoi')

const photo = (n: string) => new File(['x'], n, { type: 'image/jpeg' })

describe('envoyerGuesthouse', () => {
  beforeEach(() => {
    create.mockReset().mockResolvedValue({ id: 42 })
    uploadPhoto.mockReset().mockResolvedValue({})
    uploadVideo.mockReset().mockResolvedValue({})
  })

  it('crée le bien puis envoie les photos dans l’ordre, puis la vidéo', async () => {
    const progres = vi.fn()
    const r = await envoyerGuesthouse({ a: 1 }, [photo('1'), photo('2')], new File(['v'], 'v.mp4'), progres)
    expect(create).toHaveBeenCalledWith({ a: 1 })
    expect(uploadPhoto.mock.calls.map(c => (c[1] as File).name)).toEqual(['1', '2'])
    expect(uploadVideo).toHaveBeenCalledOnce()
    expect(progres).toHaveBeenLastCalledWith(100)
    expect(r).toEqual({ bienId: 42, photosEchouees: 0, videoEchouee: false })
  })

  it('compte les photos et la vidéo en échec au lieu de les ignorer', async () => {
    uploadPhoto.mockRejectedValueOnce(new Error('réseau')).mockResolvedValue({})
    uploadVideo.mockRejectedValue(new Error('trop lourd'))
    const r = await envoyerGuesthouse({}, [photo('1'), photo('2'), photo('3')], new File(['v'], 'v.mp4'), () => {})
    expect(uploadPhoto).toHaveBeenCalledTimes(3)
    expect(r).toEqual({ bienId: 42, photosEchouees: 1, videoEchouee: true })
  })

  it('échec de création : l’erreur remonte, aucune photo envoyée', async () => {
    create.mockRejectedValue(new Error('400'))
    await expect(envoyerGuesthouse({}, [photo('1')], null, () => {})).rejects.toThrow('400')
    expect(uploadPhoto).not.toHaveBeenCalled()
  })
})
