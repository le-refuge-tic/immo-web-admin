import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.api';
import type { CreateAdminPayload } from '../../api/admin.api';
import type { User } from '../../types';
import { useAuth } from '../../context/AuthContext';

const TYPE_BIENS = [
  { key: 'maison',        label: 'Maison',              desc: 'Villa, maison individuelle, duplex' },
  { key: 'appart_vide',   label: 'Appartement vide',    desc: 'Appartement non meublé' },
  { key: 'appart_meuble', label: 'Appartement meublé',  desc: 'Appartement avec mobilier' },
  { key: 'guesthouse',    label: 'Guesthouse',           desc: 'Maison d\'hôtes, chambre d\'hôtes' },
  { key: 'terrain',       label: 'Terrain',              desc: 'Parcelle nue, terrain agricole ou constructible' },
];

const TRANSACTIONS = [
  { key: 'vente',    label: 'Vente',    desc: 'Cession définitive du bien' },
  { key: 'location', label: 'Location', desc: 'Mise en location mensuelle ou annuelle' },
];

const STATUTS_MODERATION = [
  { key: 'en_attente', label: 'En attente', color: '#D97706', desc: 'Annonce soumise, en attente de validation admin' },
  { key: 'approuve',   label: 'Approuvé',   color: '#16A34A', desc: 'Annonce validée et visible par les clients' },
  { key: 'rejete',     label: 'Rejeté',     color: '#DC2626', desc: 'Annonce rejetée, non visible' },
];

const ROLES_USERS = [
  { key: 'client',      label: 'Client',                   desc: 'Chercheur de bien (achat ou location)' },
  { key: 'detenteur',   label: 'Propriétaire / Bailleur',  desc: 'Publie des biens à vendre ou louer' },
  { key: 'super_admin', label: 'Administrateur',            desc: 'Accès complet à l\'interface d\'administration' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="immo-card" style={{ padding: '20px 24px' }}>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <span className="section-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

function ConfigRow({ label, desc, badge, badgeColor }: {
  label: string; desc: string; badge?: string; badgeColor?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--c-border)',
    }}>
      {badge && (
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
          background: badgeColor ? `${badgeColor}20` : 'var(--c-bg)',
          color: badgeColor ?? 'var(--c-text)',
          minWidth: 80, textAlign: 'center', flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <span className="badge-actif">ACTIF</span>
    </div>
  );
}

// ── Modal création admin ─────────────────────────────────────────────────────

function CreateAdminModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (u: User) => void;
}) {
  const [form, setForm] = useState<CreateAdminPayload>({ nom: '', prenom: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.createAdmin(form);
      onCreated(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof CreateAdminPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="immo-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Nouvel administrateur</div>
        <div className="immo-modal-sub">Ce compte aura un accès complet à l'interface d'administration.</div>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom</label>
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Hounssou" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Franck" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} required placeholder="admin@houetche.com" />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Mot de passe</label>
            <input className="immo-form-input" type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="Min. 8 caractères" />
          </div>

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Création…
                </>
              ) : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Section gestion admins ───────────────────────────────────────────────────

function AdminsSection() {
  const { user: me } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getAdmins().then(setAdmins).catch(() => {});
  }, []);

  const handleCreated = (u: User) => setAdmins(a => [...a, u]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet administrateur ?')) return;
    setDeletingId(id);
    try {
      await adminApi.deleteAdmin(id);
      setAdmins(a => a.filter(x => x.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="immo-card" style={{ padding: '20px 24px' }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Administrateurs ({admins.length})</span>
          <button className="btn-blue-main" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouvel admin
          </button>
        </div>

        <div className="admin-list">
          {admins.length === 0 ? (
            <p style={{ color: 'var(--c-muted)', fontSize: 13 }}>Aucun administrateur trouvé.</p>
          ) : admins.map(a => {
            const initials = `${a.nom[0] ?? ''}${a.prenom[0] ?? ''}`.toUpperCase();
            const isMe = me?.id === a.id;
            return (
              <div className="admin-row" key={a.id}>
                <div className={`admin-avatar${isMe ? ' you' : ''}`}>{initials}</div>
                <div className="admin-info">
                  <div className="admin-info-name">{a.prenom} {a.nom}</div>
                  <div className="admin-info-email">{a.email}</div>
                </div>
                {isMe ? (
                  <span className="admin-you-badge">MOI</span>
                ) : (
                  <button
                    className="btn-icon-sm danger"
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    title="Supprimer cet administrateur"
                    style={{ flexShrink: 0 }}
                  >
                    {deletingId === a.id ? (
                      <span style={{ width: 12, height: 12, border: '2px solid #cbd5e1', borderTopColor: 'var(--c-red)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <CreateAdminModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function ConfigurationPage() {
  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Configuration</h1>
          <p>Référentiels et paramètres de la plateforme</p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="immo-page">
        {/* Gestion des administrateurs */}
        <AdminsSection />

        <div className="content-grid-2">
          {/* Types de biens */}
          <Section title="Types de biens gérés">
            {TYPE_BIENS.map((t) => (
              <ConfigRow key={t.key} label={t.label} desc={t.desc} badge={t.key.toUpperCase()} />
            ))}
          </Section>

          {/* Transactions */}
          <Section title="Types de transactions">
            {TRANSACTIONS.map((t) => (
              <ConfigRow key={t.key} label={t.label} desc={t.desc} badge={t.key.toUpperCase()} />
            ))}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--c-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 4 }}>
                À venir
              </div>
              <div style={{ fontSize: 13, color: 'var(--c-text)' }}>
                Colocation, bail commercial, viager…
              </div>
            </div>
          </Section>

          {/* Statuts de modération */}
          <Section title="Workflow de modération">
            {STATUTS_MODERATION.map((s) => (
              <ConfigRow
                key={s.key}
                label={s.label}
                desc={s.desc}
                badge={s.label.toUpperCase()}
                badgeColor={s.color}
              />
            ))}
          </Section>

          {/* Rôles utilisateurs */}
          <Section title="Rôles utilisateurs">
            {ROLES_USERS.map((r) => (
              <ConfigRow key={r.key} label={r.label} desc={r.desc} />
            ))}
          </Section>
        </div>

        {/* Infos API */}
        <div className="immo-card" style={{ padding: '16px 24px' }}>
          <div className="section-header">
            <span className="section-title">Connexion API</span>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>
                URL Backend
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>
                {import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>
                Version API
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>v1</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>
                Authentification
              </div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>JWT Bearer</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
