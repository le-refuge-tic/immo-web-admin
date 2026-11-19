import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { lienHistoriqueUtilisateur, peutVoirHistorique } from '../utils/historiqueTransactions';

/** Lot 17 — « Historique » d'un utilisateur, affiché seulement s'il est dans le périmètre du lecteur. */
export default function LienHistorique({ userId, role }: { userId: number; role: string | null | undefined }) {
  const { user } = useAuth();
  const superAdmin = (user?.role_principal ?? user?.role) === 'super_admin';
  if (!peutVoirHistorique(role, superAdmin)) return null;
  return (
    <Link to={lienHistoriqueUtilisateur(userId)} className="ut-action-btn" title="Voir son historique des transactions"
      style={{ textDecoration: 'none', borderColor: 'var(--c-border)', color: 'var(--c-blue)' }}>
      Historique
    </Link>
  );
}
