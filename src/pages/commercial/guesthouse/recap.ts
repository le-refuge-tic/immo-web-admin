import { entierFcfa, formatFcfa, MODES_RESERVATION, POLITIQUES_ANNULATION, TYPES_LIT, type GuesthouseForm } from './guesthouseForm'
import type { SectionRecap } from '../formulaire-dedie/Recapitulatif'

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

/** Lot 3 — sections du récapitulatif d'une guesthouse (chacune renvoie à son étape). */
export function sectionsRecapGuesthouse(f: GuesthouseForm, libellesEquipements: Record<string, string>): SectionRecap[] {
  const prix = entierFcfa(f.prixNuitee)
  const lits = f.lits.map(l => `${l.nombre} × ${TYPES_LIT.find(t => t.value === l.type)?.label ?? l.type}`).join(', ')
  const politique = POLITIQUES_ANNULATION.find(p => p.value === f.politiqueAnnulation)
  const mode = MODES_RESERVATION.find(m => m.value === f.modeReservation)
  return [
    { titre: 'Guesthouse et propriétaire', etape: 0, lignes: [
      f.nom.trim(), f.description.trim(),
      [f.proprioPrenom, f.proprioNom].filter(Boolean).join(' '), f.proprioTelephone, f.proprioEmail,
    ].filter(Boolean) },
    { titre: 'Localisation', etape: 1, lignes: [
      [f.quartier, f.arrondissement, f.ville].filter(Boolean).join(', '), f.repere,
    ].filter(Boolean) },
    { titre: 'Tarif et capacité', etape: 2, lignes: [
      prix !== undefined ? `${formatFcfa(prix)} / nuit` : '',
      `Séjour minimum : ${pluriel(f.nuiteesMin, 'nuit')}`,
      `${pluriel(f.capacite, 'voyageur')} · ${pluriel(f.nbChambres, 'chambre')} · ${f.nbSallesBain} salle${f.nbSallesBain > 1 ? 's' : ''} de bain`,
      f.voyageursParChambre ? `${pluriel(f.voyageursParChambre, 'voyageur')} par chambre` : '',
      lits,
    ].filter(Boolean) },
    { titre: 'Équipements, garage et règles', etape: 3, lignes: [
      f.equipements.length ? f.equipements.map(c => libellesEquipements[c] ?? c).join(', ') : 'Aucun équipement coché',
      f.garage === null ? '' : f.garage ? `Garage : oui (accès ${f.typeAccesGarage === 'prive' ? 'privé' : 'commun'})` : 'Garage : non',
      `Arrivée ${f.heureArrivee} · départ ${f.heureDepart}`,
      `Animaux ${f.animaux ? 'autorisés' : 'interdits'} · fêtes ${f.fetes ? 'autorisées' : 'interdites'} · fumeur ${f.fumeur ? 'autorisé' : 'interdit'}`,
      mode ? `Réservation : ${mode.label.toLowerCase()} (${mode.aide.toLowerCase()})` : '',
      politique ? `Annulation ${politique.label.toLowerCase()} : ${politique.aide.toLowerCase()}` : '',
    ].filter(Boolean) },
  ]
}
