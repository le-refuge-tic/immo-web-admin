/**
 * Statut d'un bien (champ `statut`, distinct de `statut_moderation`).
 * Les deux statuts « masqué » sont posés par le serveur lors de la
 * suppression du compte du propriétaire : aucune écriture n'est alors
 * possible (403 BIEN_MASQUE), quel que soit le rôle.
 */

export const STATUTS_BIEN_MASQUES = ['masque_suppression_en_cours', 'masque_proprietaire_supprime'] as const;

export const LIBELLES_STATUT_BIEN: Record<string, string> = {
  actif: 'Actif',
  occupe: 'Occupé',
  vendu: 'Vendu',
  loue: 'Loué',
  archive: 'Archivé',
  masque_suppression_en_cours: 'Masqué – suppression du propriétaire en cours',
  masque_proprietaire_supprime: 'Masqué – propriétaire supprimé',
};

export const INFO_BULLE_BIEN_MASQUE = 'Bien masqué : aucune modification possible';

export function libelleStatutBien(statut: string | null | undefined): string {
  if (!statut) return '—';
  return LIBELLES_STATUT_BIEN[statut] ?? statut;
}

export function estBienMasque(bien: { statut?: string | null } | null | undefined): boolean {
  return !!bien?.statut && (STATUTS_BIEN_MASQUES as readonly string[]).includes(bien.statut);
}

type ErreurHttp = { response?: { status?: number; data?: { code?: unknown; message?: unknown } } };

/** Message du serveur si l'erreur est un refus 403 BIEN_MASQUE, sinon null. */
export function messageBienMasque(err: unknown): string | null {
  const r = (err as ErreurHttp | null)?.response;
  if (r?.status !== 403 || r.data?.code !== 'BIEN_MASQUE') return null;
  const msg = r.data?.message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : INFO_BULLE_BIEN_MASQUE;
}
