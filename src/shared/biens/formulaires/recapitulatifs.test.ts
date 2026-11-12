import { describe, expect, it } from 'vitest'
import { formulaireVide as guesthouseVide } from './guesthouse'
import { formulaireVide as salleVide } from './salleFete'
import { sectionsRecapGuesthouse } from './recapGuesthouse'
import { sectionsRecapSalle } from './recapSalle'

describe('récapitulatifs (lot 3)', () => {
  it('guesthouse : chaque section renvoie à son étape ; champs facultatifs absents = pas de ligne', () => {
    const s = sectionsRecapGuesthouse({ ...guesthouseVide(), nom: 'Villa', prixNuitee: '25000' }, {})
    expect(s.map(x => x.etape)).toEqual([0, 1, 2, 3])
    const regles = s[3].lignes.join(' | ')
    expect(regles).not.toMatch(/Annulation|Réservation/)
    expect(s[2].lignes[0].replace(/\s/g, ' ')).toBe('25 000 FCFA / nuit')
  })

  it('guesthouse : politique et mode de réservation affichés en clair', () => {
    const s = sectionsRecapGuesthouse({ ...guesthouseVide(), politiqueAnnulation: 'moderee', modeReservation: 'sur_demande', voyageursParChambre: 2 }, {})
    expect(s[3].lignes).toContain('Annulation modérée : remboursement intégral jusqu’à 5 jours avant')
    expect(s[3].lignes).toContain('Réservation : sur demande (le propriétaire accepte chaque réservation)')
    expect(s[2].lignes).toContain('2 voyageurs par chambre')
  })

  it('salle : pièces annexes, sanitaires, PMR ; « non précisé » n’affiche rien', () => {
    const vide = sectionsRecapSalle(salleVide(), {}, {})
    expect(vide[3].lignes.join(' ')).not.toMatch(/PMR|annexes|Décoration|Alcool/)
    const s = sectionsRecapSalle({ ...salleVide(), piecesAnnexes: ['cuisine', 'loges'], nbSanitaires: '4', accesPmr: false }, {}, {})
    expect(s[3].lignes).toEqual(expect.arrayContaining(['Pièces annexes : cuisine, loges', '4 sanitaires', 'Pas d’accès PMR']))
  })
})
