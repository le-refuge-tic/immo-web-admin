import { badgeStatutCompte, type CompteAvecStatut, type TonStatutCompte } from '../utils/statutCompte';

const COULEURS: Record<TonStatutCompte, { color: string; background: string }> = {
  vert:   { color: 'var(--s-green)',  background: 'var(--t-green-bg)' },
  orange: { color: 'var(--s-yellow)', background: 'var(--t-yellow-bg)' },
  rouge:  { color: 'var(--s-red)',    background: 'var(--t-red-bg)' },
};

/** Statut du compte (actif, suppression programmée, supprimé). Rien si l'API ne l'envoie pas. */
export default function BadgeStatutCompte({ user }: { user: CompteAvecStatut | null | undefined }) {
  const badge = badgeStatutCompte(user);
  if (!badge) return null;
  return (
    <span
      title="Statut du compte"
      style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
        fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
        ...COULEURS[badge.ton],
      }}
    >
      {badge.libelle}
    </span>
  );
}
