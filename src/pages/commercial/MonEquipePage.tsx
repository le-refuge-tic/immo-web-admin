import { useState, useEffect } from 'react';
import { equipesApi, type Equipe } from '../../api/getEquipes';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '#').toUpperCase(); }
function displayName(u: any) { return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? u.telephone ?? `Utilisateur #${u.id}`); }

export default function MonEquipePage() {
  const { user } = useAuth();
  const [equipe, setEquipe]   = useState<Equipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    equipesApi.mine()
      .then(r => setEquipe(r.equipe))
      .catch(() => setEquipe(null))
      .finally(() => setLoading(false));
  }, []);

  const coequipier = equipe?.membres.find(m => m.id !== user?.id) ?? null;

  return (
    <div className="immo-page">
      <div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--c-text)', margin: 0, lineHeight: 1.2 }}>
          Mon équipe
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-muted)', margin: '0.25rem 0 0' }}>
          Votre coéquipier commercial
        </p>
      </div>

      {loading ? (
        <div className="immo-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>
          Chargement…
        </div>
      ) : !coequipier ? (
        <div className="immo-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--c-text)' }}>Aucun coéquipier pour le moment</div>
          <div style={{ color: 'var(--c-muted)', fontSize: 13 }}>
            Un administrateur peut vous associer à un autre commercial.
          </div>
        </div>
      ) : (
        <div className="immo-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: avatarColor(coequipier.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
            {initials(coequipier)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--c-text)' }}>{displayName(coequipier)}</div>
            {coequipier.telephone && <div style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 2 }}>{coequipier.telephone}</div>}
            {coequipier.email && <div style={{ fontSize: 13, color: 'var(--c-muted)' }}>{coequipier.email}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
