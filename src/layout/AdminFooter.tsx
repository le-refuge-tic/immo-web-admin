import { useAuth } from '../context/AuthContext';

export default function AdminFooter() {
  const { user } = useAuth();
  const now = new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <footer className="immo-admin-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#22C55E', flexShrink: 0,
        }} />
        <span>
          Plateforme <strong style={{ color: 'var(--c-text)' }}>HOUÉTCHÉ</strong> — opérationnelle
        </span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
        <span>{now}</span>
        {user && (
          <span style={{ color: 'var(--c-text)', fontWeight: 600 }}>
            {user.prenom} {user.nom}
          </span>
        )}
        <span style={{
          background: 'var(--c-orange-bg)', color: 'var(--c-orange)',
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          borderRadius: 4, letterSpacing: '0.5px',
        }}>
          SUPER ADMIN
        </span>
      </div>
    </footer>
  );
}
