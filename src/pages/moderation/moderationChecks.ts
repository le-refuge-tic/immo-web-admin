/** Contrôles automatiques affichés dans le panneau de détail de la modération. */
export type ModerationCheck = { label: string; ok: boolean };

const DESCRIPTION_MIN = 80;

export function moderationChecks(b: any): ModerationCheck[] {
  const nbPhotos = Array.isArray(b?.photos) ? b.photos.length : 0;
  const desc = String(b?.description ?? '').trim();
  return [
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
  `${Number(b?.prix ?? 0).toLocaleString('fr-FR')} F${b?.transaction === 'location' ? '/mois' : ''}`;

export const auteurNom = (b: any) =>
  b?.user ? `${b.user.prenom ?? ''} ${b.user.nom ?? ''}`.trim() : `Utilisateur #${b?.user_id ?? '?'}`;
