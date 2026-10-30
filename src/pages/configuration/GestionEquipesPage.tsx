import { useState, useEffect, useCallback } from 'react';
import { getCommerciaux } from '../../api/getCommerciaux';
import { equipesApi, type Equipe } from '../../api/getEquipes';
import { apiMessage } from '../../utils/apiMessage';

/* ─── Helpers ─────────────────────────────────────────────── */

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '#').toUpperCase(); }
function displayName(u: any) { return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? u.telephone ?? `Utilisateur #${u.id}`); }

/* ─── Modal : nouvelle équipe ─────────────────────────────── */

function NouvelleEquipeModal({ commerciauxDispo, onClose, onCreated }: {
  commerciauxDispo: any[]; onClose: () => void; onCreated: () => void;
}) {
  const [membre1, setMembre1] = useState('');
  const [membre2, setMembre2] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!membre1 || !membre2 || membre1 === membre2) { setError('Choisissez deux commerciaux différents.'); return; }
    setSaving(true); setError('');
    try {
      await equipesApi.create([Number(membre1), Number(membre2)]);
      onCreated();
      onClose();
    } catch (e: any) {
      setError(apiMessage(e) ?? 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 440 }}>
        <div className="immo-modal-title" style={{ marginBottom: 16 }}>Nouvelle équipe</div>
        {error && <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--s-red)' }}>{error}</div>}
        <div className="immo-form-field" style={{ marginBottom: 14 }}>
          <label className="immo-form-label">Premier commercial</label>
          <select className="immo-select" style={{ width: '100%' }} value={membre1} onChange={e => setMembre1(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {commerciauxDispo.map(c => <option key={c.id} value={c.id}>{displayName(c)}</option>)}
          </select>
        </div>
        <div className="immo-form-field" style={{ marginBottom: 20 }}>
          <label className="immo-form-label">Second commercial</label>
          <select className="immo-select" style={{ width: '100%' }} value={membre2} onChange={e => setMembre2(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {commerciauxDispo.filter(c => String(c.id) !== membre1).map(c => <option key={c.id} value={c.id}>{displayName(c)}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-submit" onClick={submit} disabled={saving}>{saving ? 'Création…' : "Créer l'équipe"}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export default function GestionEquipesPage() {
  const [equipes, setEquipes]         = useState<Equipe[]>([]);
  const [commerciaux, setCommerciaux] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const errors: string[] = [];
    const [eqs, coms] = await Promise.all([
      equipesApi.list().catch((e: any) => { errors.push(apiMessage(e) ?? 'Chargement des équipes impossible.'); return []; }),
      getCommerciaux.list().catch((e: any) => { errors.push(apiMessage(e) ?? 'Chargement des commerciaux impossible.'); return []; }),
    ]);
    setEquipes(eqs);
    setCommerciaux(coms);
    setLoadError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const idsEnEquipe = new Set(equipes.flatMap(e => e.membres.map(m => m.id)));
  const commerciauxDispo = commerciaux.filter(c => !idsEnEquipe.has(c.id));

  const handleDelete = async (id: number) => {
    try { await equipesApi.remove(id); await load(); }
    catch { /* ignore */ }
    finally { setConfirmDeleteId(null); }
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Équipes commerciales</h1>
          <p>Associez des commerciaux par binôme</p>
        </div>
        <div className="immo-spacer" />
        <button className="btn-submit" onClick={() => setShowModal(true)} disabled={commerciauxDispo.length < 2}
          title={commerciauxDispo.length < 2 ? 'Il faut au moins 2 commerciaux sans équipe' : undefined}>
          + Nouvelle équipe
        </button>
      </div>

      <div className="immo-page">
        {loadError && (
          <div style={{ background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--s-red)', fontWeight: 500, marginBottom: 16 }}>
            {loadError}{' '}
            <button onClick={load} style={{ background: 'none', border: 'none', color: 'var(--s-red)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Réessayer
            </button>
          </div>
        )}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : equipes.length === 0 ? (
          <div className="immo-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--c-muted)' }}>
            Aucune équipe pour l'instant.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {equipes.map(eq => (
              <div key={eq.id} className="immo-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Équipe #{eq.id}
                  </span>
                  {confirmDeleteId === eq.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleDelete(eq.id)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--s-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Confirmer</button>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ fontSize: 11, color: 'var(--c-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Annuler</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(eq.id)} style={{ fontSize: 11, color: 'var(--s-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Dissoudre</button>
                  )}
                </div>
                {eq.membres.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(m.id), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {initials(m)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{displayName(m)}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{m.email || m.telephone || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NouvelleEquipeModal commerciauxDispo={commerciauxDispo} onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </>
  );
}
