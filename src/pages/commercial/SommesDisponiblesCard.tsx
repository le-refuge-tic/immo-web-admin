import { useState, useEffect, useCallback } from 'react';
import { getWallet } from '../../api/getWallet';
import { postRetrait, type Retrait } from '../../api/postRetrait';
import RetraitRequestModal from './RetraitRequestModal';

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'En attente', approuve: 'Approuvé', rejete: 'Rejeté', envoye: 'Envoyé', echoue: 'Échoué',
};
const STATUT_COLOR: Record<string, string> = {
  en_attente: '#f59e0b', approuve: '#3b82f6', rejete: '#ef4444', envoye: '#10b981', echoue: '#ef4444',
};

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SommesDisponiblesCard() {
  const [solde, setSolde]       = useState(0);
  const [retraits, setRetraits] = useState<Retrait[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);

  const refresh = useCallback(async () => {
    const [w, r] = await Promise.all([
      getWallet.solde('commission_commerciale').catch(() => ({ balance: 0 } as any)),
      postRetrait.mesRetraits().catch(() => []),
    ]);
    setSolde(Number(w?.balance ?? 0));
    setRetraits(Array.isArray(r) ? r : []);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="immo-card">
      <div className="section-header">
        <span className="section-title">Sommes disponibles</span>
      </div>

      <div style={{ padding: '4px 0 16px' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--c-text)' }}>
          {loading ? '—' : formatFcfa(solde)}
        </div>
        <button
          className="btn-submit"
          onClick={() => setShowModal(true)}
          disabled={loading || solde < 500}
          style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
          Demander un retrait
        </button>
      </div>

      {retraits.length > 0 && (
        <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--c-muted)', marginBottom: 8 }}>
            Mes demandes de retrait
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {retraits.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)' }}>{formatFcfa(r.montant)}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{formatDate(r.created_at)}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                  color: STATUT_COLOR[r.statut], background: `${STATUT_COLOR[r.statut]}18`,
                }}>
                  {STATUT_LABEL[r.statut] ?? r.statut}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <RetraitRequestModal
          solde={solde}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); refresh(); }}
        />
      )}
    </div>
  );
}
