import { describe, it, expect } from 'vitest'
import { erreurFichierVideo, raisonEchecVideo } from './videoAnnonce'

const Mo = 1024 * 1024

describe('erreurFichierVideo', () => {
  it('accepte un MP4 de 50 Mo', () => {
    expect(erreurFichierVideo({ type: 'video/mp4', size: 50 * Mo })).toBeNull()
  })

  it('refuse un MP4 trop lourd en donnant sa taille', () => {
    expect(erreurFichierVideo({ type: 'video/mp4', size: 90 * Mo })).toContain('90.0 Mo')
  })

  it('refuse un autre format (ex. .mov d’iPhone)', () => {
    expect(erreurFichierVideo({ type: 'video/quicktime', size: Mo })).toContain('MP4 uniquement')
  })
})

describe('raisonEchecVideo', () => {
  it('413 : vidéo trop lourde', () => {
    expect(raisonEchecVideo({ response: { status: 413 } })).toBe('vidéo de plus de 50 Mo')
  })

  it('erreur serveur : garde le message brut (refus du stockage)', () => {
    const err = { response: { status: 500, data: { message: 'Envoi de la vidéo échoué : quota' } } }
    expect(raisonEchecVideo(err)).toBe('Envoi de la vidéo échoué : quota')
  })

  it('pas de réponse : problème de connexion', () => {
    expect(raisonEchecVideo({ request: {} })).toContain('Connexion impossible')
  })
})
