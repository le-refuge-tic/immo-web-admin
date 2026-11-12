/* Fichier identique dans immo-web-admin et immo-web-user (src/shared/biens/formulaires). */
import type { SectionRecap } from './recapitulatif'
import {
  LIBELLES_CONFIGURATION, LIBELLES_TRAITEUR, PIECES_ANNEXES, POLITIQUES_ANNULATION,
  apercuPrix, libelleHoraires, type SalleFeteForm,
} from './salleFete'

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`

/** Lot 3 — sections du récapitulatif d'une salle de fêtes (chacune renvoie à son étape). */
export function sectionsRecapSalle(
  f: SalleFeteForm,
  libellesEquipements: Record<string, string>,
  libellesEvenements: Record<string, string>,
): SectionRecap[] {
  const apercu = apercuPrix(f.prix, f.dureeHeures)
  const politique = POLITIQUES_ANNULATION.find(p => p.value === f.politiqueAnnulation)
  const annexes = PIECES_ANNEXES.filter(p => f.piecesAnnexes.includes(p.value)).map(p => p.label.toLowerCase())
  return [
    { titre: 'Salle et propriétaire', etape: 0, lignes: [
      f.nom.trim(), f.description.trim(),
      [f.proprioPrenom, f.proprioNom].filter(Boolean).join(' '), f.proprioTelephone, f.proprioEmail,
    ].filter(Boolean) },
    { titre: 'Localisation', etape: 1, lignes: [
      [f.quartier, f.arrondissement, f.ville].filter(Boolean).join(', '), f.repere,
    ].filter(Boolean) },
    { titre: 'Tarif et capacité', etape: 2, lignes: [
      apercu ? `${apercu.affiche}${apercu.parHeure ? ` (${apercu.parHeure})` : ''}` : '',
      `Durée minimum : ${pluriel(f.heuresMin, 'heure')}`,
      `${pluriel(Number(f.capacite) || 0, 'personne')}${f.superficie.trim() ? ` · ${f.superficie.trim()} m²` : ''}`,
      f.configuration ? `Configuration : ${LIBELLES_CONFIGURATION[f.configuration].toLowerCase()}` : '',
      [f.nbTables.trim() && `${f.nbTables.trim()} tables`, f.nbChaises.trim() && `${f.nbChaises.trim()} chaises`].filter(Boolean).join(' · '),
    ].filter(Boolean) },
    { titre: 'Événements, équipements et règles', etape: 3, lignes: [
      f.evenements.length ? `Événements : ${f.evenements.map(c => libellesEvenements[c] ?? c).join(', ')}` : '',
      f.equipements.length ? `Équipements : ${f.equipements.map(c => libellesEquipements[c] ?? c).join(', ')}` : '',
      f.parking === null ? '' : f.parking ? `Parking : ${pluriel(Number(f.placesParking) || 0, 'place')}` : 'Pas de parking',
      `Horaires : ${libelleHoraires(f.heureOuverture, f.heureFinMax)}`,
      f.heureFinMusique ? `Musique jusqu’à ${f.heureFinMusique}` : '',
      f.traiteur ? LIBELLES_TRAITEUR[f.traiteur][0].toUpperCase() + LIBELLES_TRAITEUR[f.traiteur].slice(1) : '',
      f.deco === null ? '' : `Décoration ${f.deco ? 'autorisée' : 'interdite'}`,
      f.alcool === null ? '' : `Alcool ${f.alcool ? 'autorisé' : 'interdit'}`,
      f.insonorisee === null ? '' : (f.insonorisee ? 'Salle insonorisée' : 'Salle non insonorisée'),
      annexes.length ? `Pièces annexes : ${annexes.join(', ')}` : '',
      f.nbSanitaires.trim() ? `${pluriel(Number(f.nbSanitaires) || 0, 'sanitaire')}` : '',
      f.accesPmr === null ? '' : f.accesPmr ? 'Accès PMR' : 'Pas d’accès PMR',
      politique ? `Annulation ${politique.label.toLowerCase()} : ${politique.aide.toLowerCase()}` : '',
    ].filter(Boolean) },
  ]
}
