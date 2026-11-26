/**
 * Cycle de suppression d'un compte (champ `statut_compte` renvoyé par l'API) :
 * actif → suppression_programmee (délai de 7 jours) → supprime.
 */

export type StatutCompte = 'actif' | 'suppression_programmee' | 'supprime';

export type TonStatutCompte = 'vert' | 'orange' | 'rouge';

export interface BadgeStatutCompte {
  libelle: string;
  ton: TonStatutCompte;
}

export interface CompteAvecStatut {
  statut_compte?: string | null;
  suppression_effective_le?: string | null;
}

/** Date au format JJ/MM/AAAA, ou null si la valeur n'est pas une date. */
export function dateCourte(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Badge à afficher pour un compte. Renvoie null si le champ est absent
 * (ancienne API) ou inconnu : rien n'est alors affiché.
 */
export function badgeStatutCompte(u: CompteAvecStatut | null | undefined): BadgeStatutCompte | null {
  switch (u?.statut_compte) {
    case 'actif':
      return { libelle: 'Actif', ton: 'vert' };
    case 'suppression_programmee': {
      const date = dateCourte(u.suppression_effective_le);
      return { libelle: date ? `Suppression le ${date}` : 'Suppression programmée', ton: 'orange' };
    }
    case 'supprime':
      return { libelle: 'Supprimé', ton: 'rouge' };
    default:
      return null;
  }
}
