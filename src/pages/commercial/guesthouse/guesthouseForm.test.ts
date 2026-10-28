import { describe, expect, it } from 'vitest'
import {
  ETAPES,
  formulaireVide,
  manquesEtape,
  construirePayload,
  PHOTOS_MIN,
  PHOTOS_MAX,
  type GuesthouseForm,
} from './guesthouseForm'

function rempli(over: Partial<GuesthouseForm> = {}): GuesthouseForm {
  return {
    ...formulaireVide(),
    nom: 'Villa Les Palmiers',
    description: 'Guesthouse calme, à 5 min de la plage.',
    proprioPrenom: 'Koffi',
    proprioNom: 'Adjovi',
    proprioTelephone: '+229 01 97 00 00 00',
    proprioEmail: '',
    ville: 'Cotonou',
    quartier: 'Fidjrossè',
    arrondissement: '12e arrondissement',
    repere: 'Derrière la station Total',
    latitude: 6.35,
    longitude: 2.4,
    prixNuitee: '25000',
    caution: '10000',
    nuiteesMin: 1,
    capacite: 4,
    nbChambres: 2,
    lits: [{ type: 'double', nombre: 1 }, { type: 'simple', nombre: 2 }],
    nbSallesBain: 1,
    equipements: ['wifi', 'climatisation'],
    garage: true,
    typeAccesGarage: 'prive',
    heureArrivee: '14:00',
    heureDepart: '11:00',
    ...over,
  }
}

const etape = (nom: string) => ETAPES.indexOf(nom as (typeof ETAPES)[number])

describe('manquesEtape', () => {
  it('formulaire rempli : rien ne manque, à aucune étape', () => {
    ETAPES.forEach((_, i) => expect(manquesEtape(i, rempli(), 4)).toEqual([]))
  })

  describe('Identité et contact', () => {
    const i = etape('Identité et contact')
    it.each([
      [{ nom: '' }, 'nom'],
      [{ nom: 'AB' }, 'nom'],
      [{ nom: 'x'.repeat(101) }, 'nom'],
      [{ description: '  ' }, 'description'],
      [{ proprioNom: '' }, 'propriétaire'],
      [{ proprioTelephone: '' }, 'téléphone'],
      [{ proprioTelephone: '12ab' }, 'téléphone'],
      [{ proprioEmail: 'pas-un-mail' }, 'e-mail'],
    ])('%o → signale « %s »', (over, mot) => {
      expect(manquesEtape(i, rempli(over), 4).join(' ').toLowerCase()).toContain(mot)
    })
    it('e-mail facultatif', () => {
      expect(manquesEtape(i, rempli({ proprioEmail: '' }), 4)).toEqual([])
    })
  })

  describe('Localisation', () => {
    const i = etape('Localisation')
    it('quartier et ville obligatoires, repère facultatif', () => {
      expect(manquesEtape(i, rempli({ quartier: '' }), 4).join(' ')).toMatch(/quartier/i)
      expect(manquesEtape(i, rempli({ ville: '' }), 4).join(' ')).toMatch(/ville/i)
      expect(manquesEtape(i, rempli({ repere: '' }), 4)).toEqual([])
    })
  })

  describe('Tarif et capacité', () => {
    const i = etape('Tarif et capacité')
    it.each([
      [{ prixNuitee: '' }, 'prix'],
      [{ prixNuitee: '0' }, 'prix'],
      [{ prixNuitee: '25000.5' }, 'prix'],
      [{ caution: '-1' }, 'caution'],
      [{ capacite: 0 }, 'capacité'],
      [{ nbChambres: 0 }, 'chambre'],
      [{ nbSallesBain: 0 }, 'salles de bain'],
      [{ nuiteesMin: 0 }, 'nuitées'],
      [{ lits: [] }, 'lit'],
      [{ lits: [{ type: 'double', nombre: 0 }] }, 'lit'],
    ])('%o → signale « %s »', (over, mot) => {
      expect(manquesEtape(i, rempli(over), 4).join(' ').toLowerCase()).toContain(mot)
    })
    it('caution facultative', () => {
      expect(manquesEtape(i, rempli({ caution: '' }), 4)).toEqual([])
    })
  })

  describe('Équipements, garage et règles', () => {
    const i = etape('Équipements, garage et règles')
    it('garage non choisi → manque', () => {
      expect(manquesEtape(i, rempli({ garage: null, typeAccesGarage: null }), 4).join(' ')).toMatch(/garage/i)
    })
    it('garage Oui sans type d’accès → manque', () => {
      expect(manquesEtape(i, rempli({ garage: true, typeAccesGarage: null }), 4).join(' ')).toMatch(/accès/i)
    })
    it('garage Non : le type d’accès n’est pas demandé', () => {
      expect(manquesEtape(i, rempli({ garage: false, typeAccesGarage: null }), 4)).toEqual([])
    })
    it('heures obligatoires ; départ plus tôt que l’arrivée accepté', () => {
      expect(manquesEtape(i, rempli({ heureArrivee: '' }), 4).join(' ')).toMatch(/arrivée/i)
      expect(manquesEtape(i, rempli({ heureArrivee: '14:00', heureDepart: '11:00' }), 4)).toEqual([])
    })
    it('aucun équipement coché : accepté', () => {
      expect(manquesEtape(i, rempli({ equipements: [] }), 4)).toEqual([])
    })
  })

  describe('Photos et récapitulatif', () => {
    const i = etape('Photos et récapitulatif')
    it(`moins de ${PHOTOS_MIN} photos → manque`, () => {
      expect(manquesEtape(i, rempli(), PHOTOS_MIN - 1).join(' ')).toContain(`${PHOTOS_MIN} photos`)
    })
    it(`plus de ${PHOTOS_MAX} photos → manque`, () => {
      expect(manquesEtape(i, rempli(), PHOTOS_MAX + 1).join(' ')).toContain(`${PHOTOS_MAX}`)
    })
    it(`entre ${PHOTOS_MIN} et ${PHOTOS_MAX} : OK`, () => {
      expect(manquesEtape(i, rempli(), PHOTOS_MIN)).toEqual([])
      expect(manquesEtape(i, rempli(), PHOTOS_MAX)).toEqual([])
    })
  })
})

describe('construirePayload', () => {
  it('produit le corps attendu par POST /biens', () => {
    const p = construirePayload(rempli())
    expect(p).toMatchObject({
      type: 'guesthouse',
      transaction: 'location',
      prix: 25000,
      description: 'Villa Les Palmiers\n\nGuesthouse calme, à 5 min de la plage.',
      localisation: {
        ville: 'Cotonou',
        quartier: 'Fidjrossè',
        latitude: 6.35,
        longitude: 2.4,
      },
      amenites: {
        proprietaire_info: { prenom: 'Koffi', nom: 'Adjovi', telephone: '+22901970000 00'.replace(/\s/g, '') },
      },
      details_guesthouse: {
        prix_nuitee: 25000,
        caution: 10000,
        nuitees_min: 1,
        capacite: 4,
        nb_chambres: 2,
        lits: [{ type: 'double', nombre: 1 }, { type: 'simple', nombre: 2 }],
        nb_salles_bain: 1,
        garage: true,
        type_acces_garage: 'prive',
        heure_arrivee: '14:00',
        heure_depart: '11:00',
        animaux_autorises: false,
        fetes_autorisees: false,
        fumeur_autorise: false,
      },
      equipements: ['wifi', 'climatisation'],
    })
  })

  it('le repère d’accès rejoint l’adresse', () => {
    expect(construirePayload(rempli()).localisation.adresse).toContain('Derrière la station Total')
  })

  it('garage Non : pas de type d’accès ; caution vide : absente', () => {
    const p = construirePayload(rempli({ garage: false, typeAccesGarage: 'commun', caution: '' }))
    expect(p.details_guesthouse.type_acces_garage).toBeUndefined()
    expect(p.details_guesthouse.caution).toBeUndefined()
  })

  it('sans position vérifiée : coordonnées par défaut (Cotonou) comme le formulaire existant', () => {
    const p = construirePayload(rempli({ latitude: null, longitude: null }))
    expect(p.localisation.latitude).toBeTypeOf('number')
    expect(p.localisation.longitude).toBeTypeOf('number')
  })

  it('e-mail vide : non envoyé', () => {
    expect(construirePayload(rempli()).amenites.proprietaire_info).not.toHaveProperty('email')
  })
})
