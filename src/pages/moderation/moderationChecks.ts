import { suffixeUnite } from '../../utils/prix';
import { manquesApprobation, photosDuBien, photosMinimumPourType } from '../../shared/biens/approbation';

/** Contrôles automatiques affichés dans le panneau de détail de la modération. */
export type ModerationCheck = { label: string; ok: boolean };

/** Photos exigées pour publier une guesthouse ou une salle de fêtes (référentiel, comme l'API). */
const PHOTOS_MIN_APPROBATION = photosMinimumPourType('guesthouse');
/** Photos exigées pour publier un bien classique (maison, appartement, terrain), comme l'API. */
export const PHOTOS_MIN_BIEN = photosMinimumPourType('maison');

/** Types qui ont leurs propres détails : sans eux, pas d'approbation (l'API refuse). */
const TYPES_AVEC_DETAILS: Record<string, { cle: string; manque: string; renseignes: string; absents: string }> = {
  guesthouse: {
    cle: 'details_guesthouse',
    manque: 'les détails guesthouse (à compléter dans « Modifier »)',
    renseignes: 'Détails guesthouse renseignés',
    absents: 'Détails guesthouse manquants',
  },
  salle_fete: {
    cle: 'details_salle_fete',
    manque: 'les détails de la salle (à compléter dans « Modifier »)',
    renseignes: 'Détails de la salle renseignés',
    absents: 'Détails de la salle manquants',
  },
};

/** Lot 7 : photos du bien et de ses pièces, un seul comptage partagé avec la fiche (et l'API). */
const nbPhotosDe = (b: any) => photosDuBien(b ?? {}).length;

/**
 * Motif pour lequel l'approbation est impossible, ou null (mêmes règles que l'API :
 * détails des guesthouses et salles, minimum de photos du référentiel).
 */
export function blocageApprobation(b: any): string | null {
  const manques = manquesApprobation(b ?? {});
  return manques.length ? `Approbation impossible : il manque ${manques.join(' et ')}.` : null;
}

const DESCRIPTION_MIN = 80;

export function moderationChecks(b: any): ModerationCheck[] {
  const nbPhotos = nbPhotosDe(b);
  const desc = String(b?.description ?? '').trim();
  const regles = TYPES_AVEC_DETAILS[b?.type];
  const specifiques: ModerationCheck[] = regles ? [
    { label: b[regles.cle] ? regles.renseignes : regles.absents, ok: !!b[regles.cle] },
    { label: nbPhotos >= PHOTOS_MIN_APPROBATION ? `${PHOTOS_MIN_APPROBATION} photos minimum : OK` : `${PHOTOS_MIN_APPROBATION} photos minimum requises`, ok: nbPhotos >= PHOTOS_MIN_APPROBATION },
  ] : [];
  return [
    ...specifiques,
    regles
      ? { label: nbPhotos > 0 ? `${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}` : 'Aucune photo', ok: nbPhotos > 0 }
      : { label: nbPhotos >= PHOTOS_MIN_BIEN ? `${nbPhotos} photos (minimum ${PHOTOS_MIN_BIEN}) : OK` : `${PHOTOS_MIN_BIEN} photos minimum requises (${nbPhotos} actuellement)`, ok: nbPhotos >= PHOTOS_MIN_BIEN },
    { label: desc.length >= DESCRIPTION_MIN ? 'Description détaillée' : `Description courte (${desc.length} car.)`, ok: desc.length >= DESCRIPTION_MIN },
    { label: b?.localisation?.quartier ? 'Quartier renseigné' : 'Quartier manquant', ok: !!b?.localisation?.quartier },
    { label: Number(b?.prix) > 0 ? 'Prix renseigné' : 'Prix manquant', ok: Number(b?.prix) > 0 },
    { label: b?.user?.telephone ? 'Auteur joignable' : 'Téléphone de l’auteur absent', ok: !!b?.user?.telephone },
  ];
}

/** Motifs de refus proposés en un clic (modifiables avant envoi). */
export const MOTIFS_REFUS = [
  'Photos manquantes ou de mauvaise qualité.',
  'Description insuffisante : précisez les pièces, l’état et les commodités.',
  'Localisation imprécise : indiquez le quartier exact.',
  'Prix incohérent avec le bien décrit.',
  'Annonce en double avec une annonce existante.',
];

export const TYPE_LABELS: Record<string, string> = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  salle_fete:    'Salle de fêtes',
  terrain:       'Terrain',
};

export const formatPrix = (b: any) =>
  `${Number(b?.prix ?? 0).toLocaleString('fr-FR')} F${suffixeUnite(b ?? {}).replace(/ /g, '')}`;

export const auteurNom = (b: any) =>
  b?.user ? `${b.user.prenom ?? ''} ${b.user.nom ?? ''}`.trim() : `Utilisateur #${b?.user_id ?? '?'}`;
