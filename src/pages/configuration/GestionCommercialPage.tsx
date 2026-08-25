import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCommerciaux } from '../../api/getCommerciaux';
import { deleteCommerciaux } from '../../api/deleteCommerciaux';
import { getAdminUser } from '../../api/getAdminUser';
import { commerciauxApi } from '../../api/getClientsCommercial';
import { supervisionApi } from '../../api/commercialSupervisionApi';
import GestionCommercialModal from './GestionCommercialModal';

/* ─── Helpers ─────────────────────────────────────────────── */

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0] ?? '#').toUpperCase(); }
function displayName(u: any) { return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? u.telephone ?? `Utilisateur #${u.id}`); }

/* ─── Modal : liste des clients d'un commercial ─────────── */

function ClientsListModal({ commercial, onClose }: { commercial: any; onClose: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerciauxApi.getClients(commercial.id)
      .then(data => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [commercial.id]);

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="immo-modal-title" style={{ marginBottom: 2 }}>
              Clients de {commercial.prenom} {commercial.nom}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {clients.length} client{clients.length > 1 ? 's' : ''} assigné{clients.length > 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <span style={{ width: 28, height: 28, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
              Aucun client assigné à ce commercial.
            </div>
          ) : (
            clients.map((c: any, idx: number) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: idx < clients.length - 1 ? '1px solid var(--c-border)' : 'none',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: avatarColor(c.id ?? 0),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff',
                }}>
                  {initials(c)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{displayName(c)}</div>
                  {(c.prenom || c.nom) && (
                    <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{c.email ?? c.telephone ?? '—'}</div>
                  )}
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE',
                  flexShrink: 0,
                }}>
                  {c.role_principal ?? c.role ?? 'prospect'}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal : attribuer un client ────────────────────────── */

function AttribuerClientModal({
  commercial,
  onClose,
  onSuccess,
}: {
  commercial: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch]       = useState('');
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [success, setSuccess]     = useState<number | null>(null);
  const [error, setError]         = useState('');

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = q.trim() ? { search: q, limit: 20 } : { limit: 50 };
      const data = await getAdminUser.list(params);
      const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? []);
      setUsers(list.filter((u: any) => !['admin', 'super_admin', 'commercial'].includes(u.role_principal ?? u.role ?? '')));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial sans filtre
  useEffect(() => { doSearch(''); }, [doSearch]);

  // Recherche à la frappe (debounce 350ms) — skip le premier rendu géré ci-dessus
  const isFirstRender = useState(true);
  useEffect(() => {
    if (isFirstRender[0]) { isFirstRender[1](false); return; }
    const t = setTimeout(() => doSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssign = async (userId: number) => {
    setAssigning(userId);
    setError('');
    try {
      await commerciauxApi.attribuerClient(commercial.id, userId);
      setSuccess(userId);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors de l\'attribution.');
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="immo-modal-title" style={{ marginBottom: 2 }}>
              Attribuer un client
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              à {commercial.prenom} {commercial.nom}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="immo-form-input"
            style={{ paddingLeft: 34 }}
            placeholder="Rechercher par nom, email ou téléphone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
            {error}
          </div>
        )}

        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--c-border)', borderRadius: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <span style={{ width: 24, height: 24, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
              {search.trim() ? 'Aucun utilisateur trouvé pour cette recherche.' : 'Aucun utilisateur disponible.'}
            </div>
          ) : (
            users.map((u: any, idx: number) => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderBottom: idx < users.length - 1 ? '1px solid var(--c-border)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: avatarColor(u.id ?? 0),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  {initials(u)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{u.prenom} {u.nom}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>{u.email ?? u.telephone ?? '—'}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.5px', textTransform: 'uppercase',
                  background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB',
                  flexShrink: 0,
                }}>
                  {u.role_principal ?? u.role ?? ''}
                </span>
                {success === u.id ? (
                  <span style={{ color: '#16A34A', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                ) : (
                  <button
                    onClick={() => handleAssign(u.id)}
                    disabled={assigning === u.id}
                    style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: 'var(--c-blue)', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    {assigning === u.id ? '…' : 'Attribuer'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal : supervision d'un commercial ────────────────── */

const TYPE_LABEL_MAP: Record<string, string> = {
  maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appart. meublé',
  guesthouse: 'Guesthouse', terrain: 'Terrain',
  chambre_salon: 'Chambre-Salon', entree_coucher: 'Entrée-Coucher',
  villa: 'Villa', maison_individuelle: 'Maison indiv.', appartement: 'Appartement',
};
const MOD_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  en_attente:   { label: 'En attente',  color: '#D97706', bg: '#FFFBEB' },
  approuve:     { label: 'Publié',      color: '#16A34A', bg: '#F0FDF4' },
  rejete:       { label: 'Rejeté',      color: '#DC2626', bg: '#FEF2F2' },
  conditionnel: { label: 'Conditionnel',color: '#7C3AED', bg: '#F5F3FF' },
};

function SupervisionModal({ commercial, onClose }: { commercial: any; onClose: () => void }) {
  const [tab, setTab]           = useState<'conversations' | 'biens'>('conversations');
  const [convs, setConvs]       = useState<any[]>([]);
  const [biens, setBiens]       = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingBiens, setLoadingBiens] = useState(false);
  const [openConv, setOpenConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply]       = useState('');
  const [sending, setSending]   = useState(false);
  const messagesEndRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingConvs(true);
    supervisionApi.getConversations(commercial.id)
      .then(d => setConvs(Array.isArray(d) ? d : []))
      .catch(() => setConvs([]))
      .finally(() => setLoadingConvs(false));
  }, [commercial.id]);

  useEffect(() => {
    if (tab !== 'biens' || biens.length > 0) return;
    setLoadingBiens(true);
    supervisionApi.getBiens(commercial.id)
      .then(d => setBiens(Array.isArray(d) ? d : []))
      .catch(() => setBiens([]))
      .finally(() => setLoadingBiens(false));
  }, [tab, commercial.id, biens.length]);

  useEffect(() => {
    if (!openConv) return;
    setLoadingMsgs(true);
    supervisionApi.getMessages(openConv.id, { limit: 50 })
      .then(d => {
        const list = Array.isArray(d) ? d : (d?.data ?? []);
        setMessages([...list].reverse());
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [openConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || !openConv) return;
    setSending(true);
    try {
      const msg = await supervisionApi.replyAsCommercial(openConv.id, reply.trim());
      setMessages(prev => [...prev, msg]);
      setReply('');
    } catch {
      // noop
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 700, width: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--c-text)' }}>
              Supervision — {commercial.prenom} {commercial.nom}
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{commercial.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-muted)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
          {([['conversations', 'Conversations'], ['biens', 'Biens']] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setOpenConv(null); }} style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              color: tab === key ? 'var(--c-blue)' : 'var(--c-muted)',
              borderBottom: tab === key ? '2px solid var(--c-blue)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {tab === 'conversations' && !openConv && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loadingConvs ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <span style={{ width: 26, height: 26, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
                </div>
              ) : convs.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucune conversation.</div>
              ) : convs.map((conv: any) => (
                <div key={conv.id} onClick={() => setOpenConv(conv)} style={{
                  padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: avatarColor(conv.user?.id ?? 0),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {initials(conv.user ?? {})}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>
                      {conv.user?.prenom ?? ''} {conv.user?.nom ?? 'Client inconnu'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {conv.last_message ?? 'Pas encore de message'}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              ))}
            </div>
          )}

          {tab === 'conversations' && openConv && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Conv header */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button onClick={() => setOpenConv(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', padding: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {openConv.user?.prenom ?? ''} {openConv.user?.nom ?? ''}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--c-muted)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '2px 8px' }}>
                  Vous répondez en tant que {commercial.prenom}
                </div>
              </div>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingMsgs ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                    <span style={{ width: 24, height: 24, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 24 }}>Aucun message.</div>
                ) : messages.map((m: any) => {
                  const isGest = m.sender_role === 'gestionnaire' || m.sender_role === 'admin' || m.sender_role === 'staff';
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isGest ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '72%', padding: '8px 12px', borderRadius: isGest ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: isGest ? 'var(--c-blue)' : 'var(--c-bg)',
                        border: isGest ? 'none' : '1px solid var(--c-border)',
                        color: isGest ? '#fff' : 'var(--c-text)',
                        fontSize: 13, lineHeight: 1.5,
                      }}>
                        {m.contenu}
                        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.65, textAlign: 'right' }}>
                          {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
                <input
                  className="immo-form-input"
                  style={{ flex: 1 }}
                  placeholder={`Répondre en tant que ${commercial.prenom}…`}
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !reply.trim()}
                  style={{
                    padding: '0 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'var(--c-blue)', color: '#fff', fontWeight: 600, fontSize: 13,
                    opacity: sending || !reply.trim() ? 0.5 : 1,
                  }}
                >
                  {sending ? '…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}

          {tab === 'biens' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loadingBiens ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <span style={{ width: 26, height: 26, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'block' }} />
                </div>
              ) : biens.length === 0 ? (
                <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucun bien publié par ce commercial.</div>
              ) : biens.map((b: any) => {
                const sousType = b.amenites?.sous_type;
                const label = TYPE_LABEL_MAP[sousType] ?? TYPE_LABEL_MAP[b.type] ?? b.type;
                const mod = MOD_LABELS[b.statut_moderation] ?? { label: b.statut_moderation, color: '#6B7280', bg: '#F3F4F6' };
                const proprio = b.amenites?.proprietaire_info;
                return (
                  <div key={b.id} style={{ padding: '12px 24px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{label}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: mod.bg, color: mod.color, border: `1px solid ${mod.color}33` }}>
                          {mod.label}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                          {b.transaction === 'location' ? 'Location' : 'Vente'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 3 }}>
                        {b.localisation?.ville ?? ''} {b.localisation?.quartier ? `· ${b.localisation.quartier}` : ''}
                        {' · '}<strong style={{ color: 'var(--c-text)' }}>{new Intl.NumberFormat('fr-FR').format(b.prix)} FCFA</strong>
                      </div>
                      {proprio && (
                        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--c-muted)', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                          Proprio : {proprio.prenom ?? ''} {proprio.nom ?? ''}{proprio.telephone ? ` · ${proprio.telephone}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────── */

export default function GestionCommercialPage() {
  const { user: me }                   = useAuth();
  const [commerciaux, setCommerciaux]  = useState([] as any[]);
  const [loading, setLoading]          = useState(true);
  const [showModal, setShowModal]      = useState(false);
  const [deletingId, setDeletingId]    = useState(null as any);
  const [clientsModal, setClientsModal]       = useState<any | null>(null);
  const [attribuerModal, setAttribuerModal]   = useState<any | null>(null);
  const [supervisionModal, setSupervisionModal] = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getCommerciaux.list()
      .then(data => setCommerciaux(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const canManage = ['admin', 'super_admin'].includes(me?.role_principal ?? me?.role ?? '');

  const totalClients = commerciaux.reduce((s, c) => s + (c.nb_clients ?? 0), 0);
  const totalBiens   = commerciaux.reduce((s, c) => s + (c.nb_biens ?? 0), 0);

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Gestion des commerciaux</h1>
          <p>Créez, supervisez et gérez les comptes commerciaux de la plateforme</p>
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
                <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M19 8l2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Clients assignés</div>
              <div className="mgmt-stat-value">{totalClients}</div>
            </div>
          </div>
          <div className="mgmt-stat-card">
            <div className="mgmt-stat-icon" style={{ background: '#FFFBEB' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div className="mgmt-stat-label">Biens publiés</div>
              <div className="mgmt-stat-value">{totalBiens}</div>
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
                Superviser, attribuer des clients et suivre l'activité de chaque commercial.
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
              <div className="mgmt-empty-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--c-text)' }}>Aucun commercial</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>Créez le premier compte commercial ci-dessus.</div>
            </div>
          ) : (
            <div className="admin-list" style={{ padding: '8px 24px' }}>
              {commerciaux.map((c: any) => {
                const inits = `${c.nom?.[0] ?? ''}${c.prenom?.[0] ?? ''}`.toUpperCase();
                const isMe  = me?.id === c.id;
                const nbClients = c.nb_clients ?? 0;
                const nbBiens   = c.nb_biens   ?? 0;

                return (
                  <div className="admin-row" key={c.id} style={{ alignItems: 'flex-start' }}>
                    <div className={`admin-avatar${isMe ? ' you' : ''}`} style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', marginTop: 4 }}>{inits}</div>
                    <div className="admin-info" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div className="admin-info-name">{c.prenom} {c.nom}</div>
                        {isMe && <span className="admin-you-badge">MOI</span>}
                      </div>
                      <div className="admin-info-email">{c.email ?? '—'}</div>
                      {/* Stats mini */}
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: 'var(--c-muted)', background: 'var(--c-bg)', border: '1px solid var(--c-border)',
                          borderRadius: 20, padding: '2px 8px',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                          </svg>
                          {nbClients} client{nbClients > 1 ? 's' : ''}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: 'var(--c-muted)', background: 'var(--c-bg)', border: '1px solid var(--c-border)',
                          borderRadius: 20, padding: '2px 8px',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                          </svg>
                          {nbBiens} bien{nbBiens > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Badge rôle */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'center',
                      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.5px', textTransform: 'uppercase',
                      background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
                    }}>
                      Commercial
                    </span>

                    {/* Actions supervision */}
                    {canManage && (
                      <div style={{ display: 'flex', gap: 6, alignSelf: 'center', flexShrink: 0 }}>
                        <button
                          className="btn-icon-sm"
                          title="Voir les clients"
                          onClick={() => setClientsModal(c)}
                          style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon-sm"
                          title="Attribuer un client"
                          onClick={() => setAttribuerModal(c)}
                          style={{ background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon-sm"
                          title="Superviser (biens & conversations)"
                          onClick={() => setSupervisionModal(c)}
                          style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"/><path d="M2.05 12A9.95 9.95 0 0 1 12 2.05M12 21.95A9.95 9.95 0 0 1 2.05 12M21.95 12A9.95 9.95 0 0 1 12 21.95M12 2.05A9.95 9.95 0 0 1 21.95 12"/>
                          </svg>
                        </button>
                        {!isMe && (
                          <button className="btn-icon-sm danger" onClick={() => handleDelete(c)} disabled={deletingId === c.id} title="Supprimer ce commercial">
                            {deletingId === c.id ? (
                              <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
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
              <strong>Peut faire :</strong> publier des annonces, visualiser tous les biens publiés, gérer ses visites, échanger avec ses clients assignés.<br/>
              <strong>Ne peut pas :</strong> valider / rejeter des biens, accéder aux loyers, finances, feedbacks ou utilisateurs.<br/>
              <strong>Attribution :</strong> les clients leur sont assignés par un administrateur — ils ne peuvent pas s'auto-attribuer des clients.
            </div>
          </div>
        </div>
      </div>

      {showModal && canManage && (
        <GestionCommercialModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
      {clientsModal && (
        <ClientsListModal commercial={clientsModal} onClose={() => setClientsModal(null)} />
      )}
      {attribuerModal && (
        <AttribuerClientModal
          commercial={attribuerModal}
          onClose={() => setAttribuerModal(null)}
          onSuccess={() => {
            load();
          }}
        />
      )}
      {supervisionModal && (
        <SupervisionModal commercial={supervisionModal} onClose={() => setSupervisionModal(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
