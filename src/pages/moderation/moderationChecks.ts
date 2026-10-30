import { suffixeUnite } from '../../utils/prix';

/** Contrôles automatiques affichés dans le panneau de détail de la modération. */
export type ModerationCheck = { label: string; ok: boolean };

/** Photos exigées pour publier une guesthouse ou une salle de fêtes (même règle que l'API). */
const PHOTOS_MIN_APPROBATION = 4;

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

const nbPhotosDe = (b: any) => (Array.isArray(b?.photos) ? b.photos.length : 0);

/**
 * Motif pour lequel l'approbation est impossible, ou null.
 * Guesthouse et salle de fêtes : détails complets et 4 photos (l'API refuse sinon).
 */
export function blocageApprobation(b: any): string | null {
  const regles = TYPES_AVEC_DETAILS[b?.type];
  if (!regles) return null;
  const manques: string[] = [];
  if (!b[regles.cle]) manques.push(regles.manque);
  const n = nbPhotosDe(b);
  if (n < PHOTOS_MIN_APPROBATION) manques.push(`au moins ${PHOTOS_MIN_APPROBATION} photos (${n} actuellement)`);
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
    { label: nbPhotos > 0 ? `${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}` : 'Aucune photo', ok: nbPhotos > 0 },
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
