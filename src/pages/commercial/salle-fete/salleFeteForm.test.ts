import { describe, expect, it } from 'vitest'
import {
  ETAPES,
  formulaireVide,
  manquesEtape,
  construirePayload,
  depuisBien,
  payloadEdition,
  apercuPrix,
  finLendemain,
  libelleHoraires,
  type SalleFeteForm,
} from './salleFeteForm'
import { PHOTOS_MAX, PHOTOS_MIN } from '../guesthouse/guesthouseForm'

function rempli(over: Partial<SalleFeteForm> = {}): SalleFeteForm {
  return {
    ...formulaireVide(),
    nom: 'Salle Les Cocotiers',
    description: 'Salle climatisée, grand parking, scène équipée.',
    proprioPrenom: 'Koffi',
    proprioNom: 'Adjovi',
    proprioTelephone: '+229 01 97 00 00 00',
    proprioEmail: '',
    ville: 'Abomey-Calavi',
    quartier: 'Kpota',
    arrondissement: 'Godomey',
    repere: 'Carrefour Kpota',
    latitude: 6.45,
    longitude: 2.35,
    prix: '45000',
    dureeHeures: 8,
    heuresMin: 4,
    caution: '50000',
    fraisMenage: '15000',
    capacite: '300',
    superficie: '400',
    configuration: 'mixte',
    nbTables: '30',
    nbChaises: '300',
    evenements: ['mariage', 'anniversaire'],
    equipements: ['sonorisation', 'climatisation'],
    parking: true,
    placesParking: '40',
    heureOuverture: '08:00',
    heureFinMax: '02:00',
    traiteur: 'libre',
    deco: true,
    alcool: true,
    heureFinMusique: '23:00',
    ...over,
  }
}

const etape = (nom: string) => ETAPES.indexOf(nom as (typeof ETAPES)[number])
const manques = (i: number, f: SalleFeteForm, photos = PHOTOS_MIN) => manquesEtape(i, f, photos).join(' ').toLowerCase()

describe('manquesEtape', () => {
  it('formulaire rempli : rien ne manque, à aucune étape', () => {
    ETAPES.forEach((_, i) => expect(manquesEtape(i, rempli(), PHOTOS_MIN)).toEqual([]))
  })

  it('formulaire vide : chaque étape signale ce qui manque', () => {
    ETAPES.forEach((_, i) => expect(manquesEtape(i, formulaireVide(), 0).length).toBeGreaterThan(0))
  })

  describe('Identité et contact', () => {
    const i = etape('Identité et contact')
    it.each([
      [{ nom: '' }, 'nom de la salle'],
      [{ nom: 'AB' }, 'nom de la salle'],
      [{ description: '  ' }, 'description'],
      [{ proprioNom: '' }, 'propriétaire'],
      [{ proprioTelephone: '12ab' }, 'téléphone'],
    ])('%o → signale « %s »', (over, mot) => {
      expect(manques(i, rempli(over))).toContain(mot)
    })
  })

  describe('Tarif et capacité', () => {
    const i = etape('Tarif et capacité')
    it.each([
      [{ prix: '' }, 'prix'],
      [{ prix: '0' }, 'prix'],
      [{ prix: '45 000,5' }, 'prix'],
      [{ dureeHeures: 0 }, 'heures couvertes'],
      [{ dureeHeures: 25 }, 'heures couvertes'],
      [{ heuresMin: 0 }, 'durée minimum'],
      [{ caution: 'abc' }, 'caution'],
      [{ fraisMenage: '-5' }, 'ménage'],
      [{ capacite: '' }, 'capacité'],
      [{ capacite: '0' }, 'capacité'],
      [{ capacite: '5001' }, 'capacité'],
      [{ superficie: '0' }, 'superficie'],
      [{ configuration: null }, 'configuration'],
      [{ nbTables: 'x' }, 'tables'],
      [{ nbChaises: '-1' }, 'chaises'],
    ])('%o → signale « %s »', (over, mot) => {
      expect(manques(i, rempli(over))).toContain(mot)
    })

    it('une salle de 300 personnes et un prix pour 24 h : acceptés', () => {
      expect(manquesEtape(i, rempli({ capacite: '5000', dureeHeures: 24 }), 4)).toEqual([])
    })

    it('caution, frais de ménage, superficie et mobilier sont facultatifs', () => {
      expect(
        manquesEtape(i, rempli({ caution: '', fraisMenage: '', superficie: '', nbTables: '', nbChaises: '' }), 4),
      ).toEqual([])
    })

    it('une caution de 0 FCFA est acceptée', () => {
      expect(manquesEtape(i, rempli({ caution: '0' }), 4)).toEqual([])
    })
  })

  describe('Événements, équipements et règles', () => {
    const i = etape('Événements, équipements et règles')
    it.each([
      [{ evenements: [] }, 'événement'],
      [{ parking: null }, 'parking'],
      [{ parking: true, placesParking: '' }, 'places'],
      [{ parking: true, placesParking: '0' }, 'places'],
      [{ heureOuverture: '25:00' }, 'ouverture'],
      [{ heureFinMax: '' }, 'fin'],
      [{ traiteur: null }, 'traiteur'],
      [{ deco: null }, 'décoration'],
      [{ alcool: null }, 'alcool'],
      [{ heureFinMusique: '23h' }, 'musique'],
    ])('%o → signale « %s »', (over, mot) => {
      expect(manques(i, rempli(over))).toContain(mot)
    })

    it('sans parking, aucune place n’est demandée', () => {
      expect(manquesEtape(i, rempli({ parking: false, placesParking: '' }), 4)).toEqual([])
    })

    it('fin après minuit (ouverture 18:00, fin 02:00) : acceptée', () => {
      expect(manquesEtape(i, rempli({ heureOuverture: '18:00', heureFinMax: '02:00' }), 4)).toEqual([])
    })

    it('musique tardive facultative', () => {
      expect(manquesEtape(i, rempli({ heureFinMusique: '' }), 4)).toEqual([])
    })

    it('aucun équipement n’est exigé', () => {
      expect(manquesEtape(i, rempli({ equipements: [] }), 4)).toEqual([])
    })
  })

  describe('Photos et récapitulatif', () => {
    const i = etape('Photos et récapitulatif')
    it('moins de 4 photos : refusé, avec le compte actuel', () => {
      expect(manquesEtape(i, rempli(), 3).join(' ')).toContain('4 photos (3')
      expect(manquesEtape(i, rempli(), 0)).not.toEqual([])
    })
    it('4 à 8 photos : accepté', () => {
      expect(manquesEtape(i, rempli(), PHOTOS_MIN)).toEqual([])
      expect(manquesEtape(i, rempli(), PHOTOS_MAX)).toEqual([])
    })
    it('plus de 8 photos : refusé', () => {
      expect(manquesEtape(i, rempli(), PHOTOS_MAX + 1)).not.toEqual([])
    })
  })
})

describe('horaires', () => {
  it('fin avant l’ouverture ou égale : tombe le lendemain', () => {
    expect(finLendemain('18:00', '02:00')).toBe(true)
    expect(finLendemain('08:00', '08:00')).toBe(true)
  })

  it('fin après l’ouverture : le même jour', () => {
    expect(finLendemain('08:00', '23:00')).toBe(false)
    expect(finLendemain('08:00', '23:59')).toBe(false)
  })

  it('heures invalides : pas de lendemain affirmé', () => {
    expect(finLendemain('', '02:00')).toBe(false)
    expect(finLendemain('18:00', '25:00')).toBe(false)
  })

  it('libellé des horaires pour le récapitulatif', () => {
    expect(libelleHoraires('08:00', '23:00')).toBe('08:00 → 23:00')
    expect(libelleHoraires('18:00', '02:00')).toBe('18:00 → 02:00 (lendemain)')
  })
})

describe('apercuPrix', () => {
  it('« 45 000 FCFA / 8 h » avec le prix à l’heure', () => {
    const a = apercuPrix('45000', 8)
    expect(a?.affiche.replace(/\s/g, ' ')).toBe('45 000 FCFA / 8 h')
    expect(a?.parHeure.replace(/\s/g, ' ')).toBe('5 625 FCFA / heure')
  })

  it('une heure : « / heure » sans doublon', () => {
    const a = apercuPrix('15000', 1)
    expect(a?.affiche.replace(/\s/g, ' ')).toBe('15 000 FCFA / heure')
    expect(a?.parHeure).toBe('')
  })

  it('prix invalide : pas d’aperçu', () => {
    expect(apercuPrix('', 8)).toBeNull()
    expect(apercuPrix('abc', 8)).toBeNull()
  })
})

describe('construirePayload', () => {
  const p = construirePayload(rempli())

  it('type, transaction et prix : posés pour le format commun (le serveur les fixe)', () => {
    expect(p).toMatchObject({ type: 'salle_fete', transaction: 'location', prix: 45000, frais_visite: 500 })
  })

  it('le nom devient la 1re ligne de la description', () => {
    expect(p.description).toBe('Salle Les Cocotiers\n\nSalle climatisée, grand parking, scène équipée.')
  })

  it('détails de la salle : entiers, enums en minuscules, heures HH:MM', () => {
    expect(p.details_salle_fete).toEqual({
      prix: 45000,
      duree_heures: 8,
      heures_min: 4,
      caution: 50000,
      frais_menage: 15000,
      capacite: 300,
      superficie_m2: 400,
      configuration: 'mixte',
      nb_tables: 30,
      nb_chaises: 300,
      parking: true,
      places_parking: 40,
      heure_ouverture: '08:00',
      heure_fin_max: '02:00',
      traiteur: 'libre',
      deco_autorisee: true,
      alcool_autorise: true,
      heure_fin_musique: '23:00',
    })
  })

  it('propriétaire dans amenites.proprietaire_info, téléphone normalisé', () => {
    expect(p.amenites.proprietaire_info).toEqual({
      prenom: 'Koffi',
      nom: 'Adjovi',
      telephone: '+2290197000000',
    })
  })

  it('événements et équipements : listes de codes', () => {
    expect(p.evenements).toEqual(['mariage', 'anniversaire'])
    expect(p.equipements).toEqual(['sonorisation', 'climatisation'])
  })

  it('valeurs facultatives vides : absentes du corps', () => {
    const d = construirePayload(
      rempli({ caution: '', fraisMenage: '', superficie: '', nbTables: '', nbChaises: '', heureFinMusique: '' }),
    ).details_salle_fete
    for (const cle of ['caution', 'frais_menage', 'superficie_m2', 'nb_tables', 'nb_chaises', 'heure_fin_musique']) {
      expect(d).not.toHaveProperty(cle)
    }
  })

  it('sans parking : pas de places envoyées', () => {
    const d = construirePayload(rempli({ parking: false, placesParking: '40' })).details_salle_fete
    expect(d.parking).toBe(false)
    expect(d).not.toHaveProperty('places_parking')
  })

  it('caution de 0 FCFA : envoyée (0 est une valeur)', () => {
    expect(construirePayload(rempli({ caution: '0' })).details_salle_fete.caution).toBe(0)
  })

  it('position par défaut de Cotonou quand l’adresse n’est pas vérifiée', () => {
    const loc = construirePayload(rempli({ latitude: null, longitude: null })).localisation
    expect(loc.latitude).toBeCloseTo(6.3654)
    expect(loc.longitude).toBeCloseTo(2.4183)
  })
})

describe('depuisBien et payloadEdition', () => {
  const bien = {
    prix: '45000.00',
    description: 'Salle Les Cocotiers\n\nSalle climatisée.',
    localisation: { ville: 'Abomey-Calavi', quartier: 'Kpota', adresse: 'Carrefour Kpota' },
    amenites: { proprietaire_info: { prenom: 'Koffi', nom: 'Adjovi', telephone: '+22997000000', email: 'k@a.bj' } },
    details_salle_fete: {
      prix: 45000, duree_heures: 8, heures_min: 4, caution: 50000, frais_menage: null, capacite: 300,
      superficie_m2: 400, configuration: 'mixte' as const, nb_tables: 30, nb_chaises: null,
      parking: true, places_parking: 40, heure_ouverture: '08:00:00', heure_fin_max: '02:00:00',
      traiteur: 'impose' as const, deco_autorisee: true, alcool_autorise: false, heure_fin_musique: null,
    },
    evenements: [{ code: 'mariage' }, { code: 'seminaire' }],
    equipements_liste: [{ code: 'sonorisation' }],
  }

  it('relit un bien : nom, valeurs en texte, heures sans les secondes', () => {
    const f = depuisBien(bien)
    expect(f).toMatchObject({
      nom: 'Salle Les Cocotiers',
      description: 'Salle climatisée.',
      prix: '45000',
      dureeHeures: 8,
      heuresMin: 4,
      caution: '50000',
      fraisMenage: '',
      capacite: '300',
      configuration: 'mixte',
      nbTables: '30',
      nbChaises: '',
      parking: true,
      placesParking: '40',
      heureOuverture: '08:00',
      heureFinMax: '02:00',
      traiteur: 'impose',
      deco: true,
      alcool: false,
      heureFinMusique: '',
      proprioNom: 'Adjovi',
      proprioEmail: 'k@a.bj',
      evenements: ['mariage', 'seminaire'],
      equipements: ['sonorisation'],
    })
  })

  it('un bien sans détails repart des valeurs par défaut, avec son prix et ses équipements', () => {
    const f = depuisBien({ ...bien, details_salle_fete: null, evenements: [] })
    expect(f.prix).toBe('45000')
    expect(f.parking).toBeNull()
    expect(f.configuration).toBeNull()
    expect(f.evenements).toEqual([])
  })

  it('aller-retour : relire puis reconstruire donne les mêmes détails', () => {
    const f = depuisBien(bien)
    const d = payloadEdition(f).details_salle_fete
    expect(d).toMatchObject({ prix: 45000, duree_heures: 8, capacite: 300, heure_fin_max: '02:00', traiteur: 'impose' })
  })

  it('édition : une valeur facultative effacée est envoyée à null pour être vidée côté serveur', () => {
    const f = depuisBien(bien)
    const d = payloadEdition({ ...f, caution: '', parking: false, placesParking: '' }).details_salle_fete
    expect(d.caution).toBeNull()
    expect(d.parking).toBe(false)
    expect(d.places_parking).toBeNull()
    expect(d.heure_fin_musique).toBeNull()
  })

  it('édition : le type et la position ne sont pas envoyés', () => {
    const e = payloadEdition(depuisBien(bien))
    expect(e).not.toHaveProperty('type')
    expect(e.localisation).toEqual({ ville: 'Abomey-Calavi', quartier: 'Kpota', adresse: 'Carrefour Kpota' })
    expect(e.evenements).toEqual(['mariage', 'seminaire'])
  })
})
