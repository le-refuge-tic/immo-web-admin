/**
 * Lot 8 — alertes de l'administration (admins et commerciaux) : où mène chaque alerte,
 * et lesquelles s'annoncent par un toast quand elles arrivent en direct.
 */

type Ton = 'success' | 'error' | 'info';

/** Alertes annoncées par un toast pendant la session, avec leur ton. */
const EN_DIRECT: Record<string, Ton> = {
  bien_a_valider: 'info',
  bien_modifie: 'info',
  bien_approuve: 'success',
  modification_approuvee: 'success',
  bien_rejete: 'error',
  bien_revoque: 'error',
  modification_rejetee: 'error',
  bien_conditionnel: 'info',
  type_bien_change: 'info',
};

/** Alertes à traiter dans la file de modération (admins). */
const VERS_MODERATION = new Set(['bien_a_valider', 'bien_modifie']);

export interface AlerteLue {
  type: string;
  meta?: Record<string, unknown> | null;
}

/** Page à ouvrir pour une alerte ; null si elle ne mène nulle part. */
export function lienAlerte(a: AlerteLue, estAdmin: boolean): string | null {
  if (VERS_MODERATION.has(a.type)) return '/moderation';
  const bienId = Number(a.meta?.bien_id);
  if (!Number.isInteger(bienId) || bienId <= 0) return null;
  return estAdmin ? `/annonces/${bienId}` : `/mes-annonces/${bienId}`;
}

/** Événement socket `alertes:maj` (raison `nouvelle` : titre et texte joints par l'API). */
export interface EvenementAlerte {
  raison?: string;
  type?: string;
  titre?: string;
  corps?: string;
}

export function toastPourAlerte(e: EvenementAlerte | null | undefined): { message: string; ton: Ton } | null {
  if (e?.raison !== 'nouvelle' || !e.type || !e.titre) return null;
  const ton = EN_DIRECT[e.type];
  if (!ton) return null;
  const corps = e.corps?.trim();
  return { message: corps ? `${e.titre} — ${corps}` : e.titre, ton };
}

/** Relais du socket (useSidebarBadges) vers la cloche : `detail` = EvenementAlerte. */
export const EVENEMENT_ALERTES = 'alertes:maj';
