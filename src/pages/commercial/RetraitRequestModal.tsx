import { useState, type FormEvent } from 'react';
import { postRetrait } from '../../api/postRetrait';

function formatFcfa(v: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';
}

export default function RetraitRequestModal({ solde, onClose, onSuccess }: {
  solde: number; onClose: () => void; onSuccess: () => void;
}) {
  const [montant, setMontant] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const montantNum = Number(montant);
  const canSubmit = montantNum >= 500 && montantNum <= solde;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      await postRetrait.demander(montantNum, 'commission_commerciale');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de créer la demande de retrait.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: 16,
        padding: '32px 28px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          Demander un retrait
        </h2>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 20 }}>
          Solde disponible : <strong>{formatFcfa(solde)}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="immo-form-field" style={{ marginBottom: 8 }}>
            <label className="immo-form-label">Montant à retirer (FCFA) *</label>
            <input
              className="immo-form-input"
              type="number"
              min={500}
              max={solde}
              step={100}
              value={montant}
              onChange={e => { setMontant(e.target.value); setError(''); }}
              placeholder="Minimum 500 FCFA"
              autoFocus
              disabled={loading}
              required
            />
          </div>
          {montant !== '' && montantNum > solde && (
            <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 12 }}>Montant supérieur au solde disponible.</div>
          )}
          {montant !== '' && montantNum > 0 && montantNum < 500 && (
            <div style={{ fontSize: 11, color: '#DC2626', marginBottom: 12 }}>Montant minimum : 500 FCFA.</div>
          )}

          {error && (
            <div style={{
              marginTop: 8, marginBottom: 14, padding: '8px 12px',
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#DC2626',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} disabled={loading}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--c-border)', background: '#fff', color: 'var(--c-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={loading || !canSubmit}
              style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, opacity: canSubmit ? 1 : 0.5 }}>
              {loading ? 'Envoi…' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
