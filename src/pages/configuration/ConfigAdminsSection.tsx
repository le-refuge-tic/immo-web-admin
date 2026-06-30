import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdmins } from '../../api/getAdmins';
import { deleteAdmins } from '../../api/deleteAdmins';
import ConfigCreateAdminModal from './ConfigCreateAdminModal';

export default function ConfigAdminsSection() {
  const { user: me }                    = useAuth();
  const [admins, setAdmins]             = useState([] as any[]);
  const [showModal, setShowModal]       = useState(false);
  const [deletingId, setDeletingId]     = useState(null as any);

  useEffect(() => {
    getAdmins.list().then(setAdmins).catch(() => {});
  }, []);

  const handleCreated = (u: any) => setAdmins(a => [...a, u]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet administrateur ?')) return;
    setDeletingId(id);
    try {
      await deleteAdmins.byId(id);
      setAdmins(a => a.filter((x: any) => x.id !== id));
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
          ) : admins.map((a: any) => {
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
        <ConfigCreateAdminModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
