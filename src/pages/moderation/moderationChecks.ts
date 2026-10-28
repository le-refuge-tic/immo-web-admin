import { suffixeUnite } from '../../utils/prix';

/** Contrôles automatiques affichés dans le panneau de détail de la modération. */
export type ModerationCheck = { label: string; ok: boolean };

/** Photos exigées pour publier une guesthouse (même règle que l'API). */
const PHOTOS_MIN_GUESTHOUSE = 4;

const nbPhotosDe = (b: any) => (Array.isArray(b?.photos) ? b.photos.length : 0);

/**
 * Motif pour lequel l'approbation est impossible, ou null.
 * Guesthouse : détails complets et 4 photos (l'API refuse sinon).
 */
export function blocageApprobation(b: any): string | null {
  if (b?.type !== 'guesthouse') return null;
  const manques: string[] = [];
  if (!b.details_guesthouse) manques.push('les détails guesthouse (à compléter dans « Modifier »)');
  const n = nbPhotosDe(b);
  if (n < PHOTOS_MIN_GUESTHOUSE) manques.push(`au moins ${PHOTOS_MIN_GUESTHOUSE} photos (${n} actuellement)`);
  return manques.length ? `Approbation impossible : il manque ${manques.join(' et ')}.` : null;
}

const DESCRIPTION_MIN = 80;

export function moderationChecks(b: any): ModerationCheck[] {
  const nbPhotos = nbPhotosDe(b);
  const desc = String(b?.description ?? '').trim();
  const guesthouse: ModerationCheck[] = b?.type === 'guesthouse' ? [
    { label: b.details_guesthouse ? 'Détails guesthouse renseignés' : 'Détails guesthouse manquants', ok: !!b.details_guesthouse },
    { label: nbPhotos >= PHOTOS_MIN_GUESTHOUSE ? `${PHOTOS_MIN_GUESTHOUSE} photos minimum : OK` : `${PHOTOS_MIN_GUESTHOUSE} photos minimum requises`, ok: nbPhotos >= PHOTOS_MIN_GUESTHOUSE },
  ] : [];
  return [
    ...guesthouse,
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
  terrain:       'Terrain',
};

export const formatPrix = (b: any) =>
  `${Number(b?.prix ?? 0).toLocaleString('fr-FR')} F${suffixeUnite(b ?? {}).replace(/ /g, '')}`;

export const auteurNom = (b: any) =>
  b?.user ? `${b.user.prenom ?? ''} ${b.user.nom ?? ''}`.trim() : `Utilisateur #${b?.user_id ?? '?'}`;
