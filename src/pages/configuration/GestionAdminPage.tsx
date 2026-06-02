import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin.api';
import type { CreateAdminPayload } from '../../api/admin.api';
import type { User } from '../../types';

// ── Modal création admin ──────────────────────────────────────────────────────

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

  const set = (field: keyof CreateAdminPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));

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

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal">
        <div className="immo-modal-title">Nouvel administrateur</div>
        <div className="immo-modal-sub">
          Ce compte aura accès à l'interface d'administration.
          Seul vous (Super Admin) pourrez le supprimer.
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Nom</label>
              <input className="immo-form-input" value={form.nom} onChange={set('nom')} required placeholder="Dupont" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prénom</label>
              <input className="immo-form-input" value={form.prenom} onChange={set('prenom')} required placeholder="Jean" />
            </div>
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse email</label>
            <input className="immo-form-input" type="email" value={form.email} onChange={set('email')} required placeholder="admin@houetche.com" />
          </div>
          <div className="immo-form-field">
            <label className="immo-form-label">Mot de passe temporaire</label>
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
              ) : 'Créer l\'administrateur'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ── Badge rôle ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isSuperAdmin = role === 'super_admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.5px', textTransform: 'uppercase',
      background: isSuperAdmin ? '#FFF7ED' : '#EFF6FF',
      color: isSuperAdmin ? 'var(--c-orange)' : 'var(--c-blue)',
      border: `1px solid ${isSuperAdmin ? '#FED7AA' : '#BFDBFE'}`,
    }}>
      {isSuperAdmin ? '★ Super Admin' : 'Administrateur'}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GestionAdminPage() {
  const { user: me } = useAuth();
  const [admins, setAdmins]     = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getAdmins()
      .then(setAdmins)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (u: User) => setAdmins(a => [...a, u]);

  const handleDelete = async (admin: User) => {
    if (!confirm(`Supprimer l'administrateur ${admin.prenom} ${admin.nom} ?`)) return;
    setDeletingId(admin.id);
    try {
      await adminApi.deleteAdmin(admin.id);
      setAdmins(a => a.filter(x => x.id !== admin.id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const total       = admins.length;
  const totalSuper  = admins.filter(a => a.role === 'super_admin').length;
  const totalAdmin  = admins.filter(a => a.role === 'admin').length;

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Gestion des administrateurs</h1>
          <p>Créez et gérez les comptes administrateurs de la plateforme</p>
        </div>
      </div>

      <div className="immo-page">
        {/* Stats */}
        <div className="mgmt-stats">
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#EFF6FF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Total admins</div>
              <div className="mgmt-stat-value">{total}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#FFF7ED' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Super Admin</div>
              <div className="mgmt-stat-value">{totalSuper}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#F0FDF4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Administrateurs</div>
              <div className="mgmt-stat-value">{totalAdmin}</div>
            </div>
          </div>
        </div>

        {/* Liste */}
        <div className="immo-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid var(--c-border)',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>
                Équipe d'administration
              </div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
                Les Super Admins ne peuvent pas être supprimés depuis cette interface.
              </div>
            </div>
            <button
              className="btn-blue-main"
              style={{ fontSize: 12, padding: '8px 16px', flexShrink: 0 }}
              onClick={() => setShowModal(true)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouvel admin
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
            </div>
          ) : admins.length === 0 ? (
            <div className="mgmt-empty">
              <div className="mgmt-empty-icon">👤</div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>Aucun administrateur</div>
            </div>
          ) : (
            <div className="admin-list" style={{ padding: '8px 24px' }}>
              {admins.map(a => {
                const initials = `${a.nom[0] ?? ''}${a.prenom[0] ?? ''}`.toUpperCase();
                const isMe      = me?.id === a.id;
                const isSuperAdm = a.role === 'super_admin';
                const canDelete  = !isMe && !isSuperAdm;

                return (
                  <div className="admin-row" key={a.id}>
                    <div className={`admin-avatar${isMe ? ' you' : ''}`}>{initials}</div>
                    <div className="admin-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div className="admin-info-name">{a.prenom} {a.nom}</div>
                        {isMe && <span className="admin-you-badge">MOI</span>}
                      </div>
                      <div className="admin-info-email">{a.email ?? '—'}</div>
                    </div>
                    <RoleBadge role={a.role} />
                    {canDelete ? (
                      <button
                        className="btn-icon-sm danger"
                        onClick={() => handleDelete(a)}
                        disabled={deletingId === a.id}
                        title="Supprimer cet administrateur"
                        style={{ flexShrink: 0 }}
                      >
                        {deletingId === a.id ? (
                          <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        )}
                      </button>
                    ) : (
                      <div style={{ width: 30 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Note explicative */}
        <div className="immo-card" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 3 }}>
              Hiérarchie des rôles
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
              <strong>Administrateur</strong> : accès complet à la gestion des biens, utilisateurs et modération.<br/>
              <strong>Super Admin</strong> : mêmes droits + gestion des administrateurs. Ne peut être supprimé que via la base de données.
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateAdminModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
