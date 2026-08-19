import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCommerciaux } from '../../api/getCommerciaux';
import { deleteCommerciaux } from '../../api/deleteCommerciaux';
import GestionCommercialModal from './GestionCommercialModal';

export default function GestionCommercialPage() {
  const { user: me }                  = useAuth();
  const [commerciaux, setCommerciaux] = useState([] as any[]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [deletingId, setDeletingId]   = useState(null as any);

  useEffect(() => {
    getCommerciaux.list()
      .then(data => setCommerciaux(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (u: any) => setCommerciaux(c => [...c, u]);

  const handleDelete = async (commercial: any) => {
    if (!confirm(`Supprimer le commercial ${commercial.prenom} ${commercial.nom} ?`)) return;
    setDeletingId(commercial.id);
    try {
      await deleteCommerciaux.byId(commercial.id);
      setCommerciaux(c => c.filter((x: any) => x.id !== commercial.id));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const canManage = me?.role === 'admin' || me?.role === 'super_admin';

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Gestion des commerciaux</h1>
          <p>Créez et gérez les comptes commerciaux de la plateforme</p>
        </div>
      </div>

      <div className="immo-page">
        {/* Stats */}
        <div className="mgmt-stats">
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#F0FDF4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Total commerciaux</div>
              <div className="mgmt-stat-value">{commerciaux.length}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#EFF6FF' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Accès</div>
              <div className="mgmt-stat-value" style={{ fontSize: 13 }}>Annonces · Messages</div>
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
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)' }}>Équipe commerciale</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>
                Les commerciaux peuvent publier des annonces et utiliser la messagerie, sans pouvoir valider de biens.
              </div>
            </div>
            {canManage && (
              <button className="btn-blue-main" style={{ fontSize: 12, padding: '8px 16px', flexShrink: 0 }} onClick={() => setShowModal(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Nouveau commercial
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <span style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
            </div>
          ) : commerciaux.length === 0 ? (
            <div className="mgmt-empty">
              <div className="mgmt-empty-icon">👔</div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>Aucun commercial</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Créez le premier compte commercial ci-dessus.</div>
            </div>
          ) : (
            <div className="admin-list" style={{ padding: '8px 24px' }}>
              {commerciaux.map((c: any) => {
                const initials = `${c.nom?.[0] ?? ''}${c.prenom?.[0] ?? ''}`.toUpperCase();
                const isMe     = me?.id === c.id;

                return (
                  <div className="admin-row" key={c.id}>
                    <div className={`admin-avatar${isMe ? ' you' : ''}`} style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}>{initials}</div>
                    <div className="admin-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div className="admin-info-name">{c.prenom} {c.nom}</div>
                        {isMe && <span className="admin-you-badge">MOI</span>}
                      </div>
                      <div className="admin-info-email">{c.email ?? '—'}</div>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                    }}>
                      Commercial
                    </span>
                    {canManage && !isMe ? (
                      <button className="btn-icon-sm danger" onClick={() => handleDelete(c)} disabled={deletingId === c.id} title="Supprimer ce commercial" style={{ flexShrink: 0 }}>
                        {deletingId === c.id ? (
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

        {/* Info permissions */}
        <div className="immo-card" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 3 }}>Permissions du rôle Commercial</div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', lineHeight: 1.6 }}>
              <strong>Peut faire :</strong> publier des annonces, visualiser tous les biens publiés, utiliser la messagerie.<br/>
              <strong>Ne peut pas :</strong> valider / rejeter des biens, accéder aux loyers, finances, feedbacks ou utilisateurs.
            </div>
          </div>
        </div>
      </div>

      {showModal && canManage && (
        <GestionCommercialModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
