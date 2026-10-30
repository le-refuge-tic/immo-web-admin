import { useState, useEffect, useCallback } from 'react';
import { CheckIcon, XIcon } from '../../components/Icons';
import { verificationsApi } from '../../api/verificationsApi';

const ROLE_LABELS: any = {
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  detenteur:    'Propriétaire / Bailleur',
};

type ActionType = 'valider' | 'rejeter';

// ── Modal d'action (validation ou rejet) ────────────────────────────────────

function VerificationModal({
  demande,
  type,
  onClose,
  onDone,
}: {
  demande: any;
  type: ActionType;
  onClose: () => void;
  onDone: () => void;
}) {
  const [motif, setMotif]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const isValider = type === 'valider';
  const canSubmit = isValider || motif.trim().length >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      if (isValider) {
        await verificationsApi.valider(demande.id);
      } else {
        await verificationsApi.rejeter(demande.id, motif.trim());
      }
      onDone();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div style={{
          background: isValider ? 'var(--c-green-bg, #F0FDF4)' : 'var(--c-red-bg)',
          border: `1px solid ${isValider ? 'var(--c-green, #16A34A)' : 'var(--c-red)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>{isValider ? '✅' : '❌'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: isValider ? 'var(--c-green, #16A34A)' : 'var(--c-red)' }}>
              {isValider ? 'Valider ces documents' : 'Rejeter ces documents'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
              {demande.prenom} {demande.nom} — {ROLE_LABELS[demande.role_principal] ?? demande.role_principal}
            </div>
          </div>
        </div>

        <div className="immo-modal-title">
          {isValider ? 'Confirmer la validation' : 'Motif de rejet'}
        </div>
        <div className="immo-modal-sub">
          {isValider
            ? "Le propriétaire recevra une notification confirmant que ses documents sont vérifiés."
            : "Expliquez pourquoi ces documents sont rejetés. Le propriétaire recevra ce motif et pourra soumettre de nouveaux documents."}
        </div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid #FECACA', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isValider && (
            <div className="immo-form-field">
              <label className="immo-form-label">Motif de rejet *</label>
              <textarea
                className="immo-form-input"
                rows={3}
                placeholder="Ex : Photo illisible, document expiré, informations non lisibles…"
                value={motif}
                onChange={e => setMotif(e.target.value)}
                required
                autoFocus
                style={{ resize: 'vertical', minHeight: 80 }}
              />
            </div>
          )}

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!canSubmit || loading}
              style={!isValider ? { background: 'var(--c-red)', borderColor: 'var(--c-red)' } : undefined}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Envoi…
                </>
              ) : isValider ? 'Valider les documents' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const [demandes, setDemandes] = useState([] as any[]);
  const [loading, setLoading]   = useState(false);

  const [modal, setModal] = useState<{ demande: any; type: ActionType } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await verificationsApi.list();
      setDemandes(Array.isArray(data) ? data : data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      {modal && (
        <VerificationModal
          demande={modal.demande}
          type={modal.type}
          onClose={() => setModal(null)}
          onDone={load}
        />
      )}

      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Vérifications</h1>
          <p>Demandes de vérification d'identité (CIP / IFU) en attente</p>
        </div>
      </div>

      <div className="immo-page">
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="mod-table-header">
            <span className="mod-table-col">Utilisateur</span>
            <span className="mod-table-col">Rôle</span>
            <span className="mod-table-col">Documents</span>
            <span className="mod-table-col">Soumis le</span>
            <span className="mod-table-col">Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : demandes.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune demande de vérification en attente.</div>
          ) : (
            demandes.map((d: any) => (
              <div className="mod-row" key={d.id}>
                <div className="mod-agent-cell">
                  <div className="agent-av" style={{ background: '#94A3B8' }}>
                    {`${d.nom?.[0] ?? ''}${d.prenom?.[0] ?? ''}`.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="agent-name">{d.prenom} {d.nom}</div>
                    <div className="agent-status">{d.email ?? d.telephone ?? `Utilisateur #${d.id}`}</div>
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {ROLE_LABELS[d.role_principal] ?? d.role_principal}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {d.cip_url && (
                    <a href={d.cip_url} target="_blank" rel="noreferrer" className="btn-cancel" style={{ padding: '4px 10px', fontSize: 12 }}>
                      Voir CIP
                    </a>
                  )}
                  {d.ifu_url && (
                    <a href={d.ifu_url} target="_blank" rel="noreferrer" className="btn-cancel" style={{ padding: '4px 10px', fontSize: 12 }}>
                      Voir IFU
                    </a>
                  )}
                  {!d.cip_url && !d.ifu_url && <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>—</span>}
                </div>

                <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                  {d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '—'}
                </div>

                <div className="mod-actions-cell">
                  <button
                    className="btn-validate-circle"
                    onClick={() => setModal({ demande: d, type: 'valider' })}
                    title="Valider"
                  >
                    <CheckIcon size={15} />
                  </button>
                  <button
                    className="btn-reject-circle"
                    onClick={() => setModal({ demande: d, type: 'rejeter' })}
                    title="Rejeter"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
