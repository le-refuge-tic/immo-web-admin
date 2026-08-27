import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessages } from '../../api/getMessages';
import { postMessage } from '../../api/postMessage';
import { useAuth } from '../../context/AuthContext';

/* ─── Constantes ─────────────────────────────────────────────── */

const POLL_LIST_MS  = 15_000;
const POLL_MSGS_MS  =  5_000;
const CLAIM_TTL_MS  = 5 * 60_000;
const CLAIM_PREFIX  = 'sup_claim_';

const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#16A34A','#0891B2','#DC2626','#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) {
  return `${u?.prenom?.[0] ?? ''}${u?.nom?.[0] ?? ''}`.toUpperCase() || '?';
}
function displayName(u: any) {
  if (!u) return '—';
  return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? `#${u.id}`);
}

const ROLE_LABELS: Record<string, string> = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  client:       'Client',
  commercial:   'Commercial',
  admin:        'Admin',
  super_admin:  'Super Admin',
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateSep(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/* ─── Claim helpers (localStorage) ──────────────────────────── */

function setClaim(convId: number, adminName: string) {
  try {
    localStorage.setItem(`${CLAIM_PREFIX}${convId}`, JSON.stringify({ name: adminName, at: Date.now() }));
    window.dispatchEvent(new StorageEvent('storage', { key: `${CLAIM_PREFIX}${convId}` }));
  } catch { /* ignore */ }
}

function clearClaim(convId: number) {
  try {
    localStorage.removeItem(`${CLAIM_PREFIX}${convId}`);
  } catch { /* ignore */ }
}

function readClaim(convId: number): { name: string; at: number } | null {
  try {
    const raw = localStorage.getItem(`${CLAIM_PREFIX}${convId}`);
    if (!raw) return null;
    const claim = JSON.parse(raw);
    if (Date.now() - claim.at > CLAIM_TTL_MS) { localStorage.removeItem(`${CLAIM_PREFIX}${convId}`); return null; }
    return claim;
  } catch { return null; }
}

/* ─── Info-bulle client ─────────────────────────────────────── */

function ClientPopover({ user, onClose }: { user: any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const role = user?.role_principal ?? user?.role ?? '';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 300,
      background: '#fff', border: '1px solid var(--c-border)', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '14px 16px',
      minWidth: 220, marginTop: 6,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: avatarColor(user?.id ?? 0),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
        }}>{initials(user)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{displayName(user)}</div>
          {role && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8',
              borderRadius: 20, padding: '1px 7px', display: 'inline-block', marginTop: 2,
            }}>{ROLE_LABELS[role] ?? role}</span>
          )}
        </div>
      </div>
      {user?.email && (
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 3 }}>
          <strong style={{ color: 'var(--c-text)' }}>Email :</strong> {user.email}
        </div>
      )}
      {user?.telephone && (
        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
          <strong style={{ color: 'var(--c-text)' }}>Tel :</strong> {user.telephone}
        </div>
      )}
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */

export default function SupervisionPage() {
  const { user: me } = useAuth();
  const adminName = me ? displayName(me) : 'Admin';

  const [convs, setConvs]               = useState<any[]>([]);
  const [totalUnread, setTotalUnread]   = useState(0);
  const [loading, setLoading]           = useState(true);
  const [activeId, setActiveId]         = useState<number | null>(null);
  const [messages, setMessages]         = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [search, setSearch]             = useState('');
  const [unreadOnly, setUnreadOnly]     = useState(false);
  const [claims, setClaims]             = useState<Record<number, { name: string; at: number }>>({});
  const [popover, setPopover]           = useState<number | null>(null);
  const [activeTab, setActiveTab]       = useState<'commerciaux' | 'proprietaires'>('commerciaux');

  const bottomRef = useRef<HTMLDivElement>(null);
  const listPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgsPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Chargement de la liste ── */
  const loadConvs = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const res = await getMessages.supervision();
      const sorted = [...res.data].sort((a, b) => {
        if ((b.unread_count ?? 0) !== (a.unread_count ?? 0))
          return (b.unread_count ?? 0) - (a.unread_count ?? 0);
        const ta = a.last_message_at ?? a.created_at;
        const tb = b.last_message_at ?? b.created_at;
        return new Date(tb).getTime() - new Date(ta).getTime();
      });
      setConvs(sorted);
      setTotalUnread(res.total_unread);
    } catch { /* silencieux */ }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => {
    loadConvs();
    listPollRef.current = setInterval(() => loadConvs(true), POLL_LIST_MS);
    return () => { if (listPollRef.current) clearInterval(listPollRef.current); };
  }, [loadConvs]);

  /* ── Chargement thread ── */
  const loadMsgs = useCallback(async (id: number, quiet = false) => {
    if (!quiet) { setLoadingMsgs(true); setMessages([]); }
    try {
      const res = await getMessages.thread(id, { limit: 100 });
      setMessages(res.data ?? res);
    } catch { /* silencieux */ }
    finally { if (!quiet) setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (activeId == null) return;
    loadMsgs(activeId);
    if (msgsPollRef.current) clearInterval(msgsPollRef.current);
    msgsPollRef.current = setInterval(() => loadMsgs(activeId, true), POLL_MSGS_MS);
    return () => { if (msgsPollRef.current) clearInterval(msgsPollRef.current); };
  }, [activeId, loadMsgs]);

  /* ── Scroll bas ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Sync claims localStorage ── */
  const syncClaims = useCallback(() => {
    const result: Record<number, { name: string; at: number }> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(CLAIM_PREFIX)) continue;
      const id = Number(k.replace(CLAIM_PREFIX, ''));
      const c = readClaim(id);
      if (c) result[id] = c;
    }
    setClaims(result);
  }, []);

  useEffect(() => {
    syncClaims();
    window.addEventListener('storage', syncClaims);
    return () => window.removeEventListener('storage', syncClaims);
  }, [syncClaims]);

  /* ── Sélection conversation ── */
  function selectConv(id: number) {
    if (activeId !== null) clearClaim(activeId);
    setActiveId(id);
    setInput('');
    const conv = convs.find(c => c.id === id);
    if (conv && !isProprioConv(conv)) {
      setClaim(id, adminName);
      syncClaims();
    }
    // Marquer comme lu côté affichage
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
  }

  /* ── Envoi message ── */
  async function handleSend() {
    const text = input.trim();
    if (!text || activeId == null || sending) return;
    if (activeConvIsPropio) return; // jamais d'envoi en lecture seule
    setInput('');
    setSending(true);
    try {
      const msg = await postMessage.send(activeId, { contenu: text });
      setMessages(prev => [...prev, msg]);
      setConvs(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, last_message: text, last_message_at: new Date().toISOString(), unread_count: 0 }
          : c
      ));
      // Mettre à jour la liste dans 2s (le backend a eu le temps de mettre à jour)
      setTimeout(() => loadConvs(true), 2000);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  /* ── Nettoyage claim au départ ── */
  useEffect(() => {
    return () => { if (activeId !== null) clearClaim(activeId); };
  }, [activeId]);

  /* ── Filtrage côté client ── */
  const isCommercialConv = (c: any) =>
    c.gestionnaire_role === 'commercial' || c.gestionnaire_role === 'demarcheur' || !c.gestionnaire_role;
  const isProprioConv = (c: any) => c.gestionnaire_role === 'proprietaire';

  const filtered = convs.filter(c => {
    // Filtre onglet
    if (activeTab === 'commerciaux' && !isCommercialConv(c)) return false;
    if (activeTab === 'proprietaires' && !isProprioConv(c)) return false;
    // Filtre non lus
    if (unreadOnly && (c.unread_count ?? 0) === 0) return false;
    // Filtre recherche
    if (search) {
      const q = search.toLowerCase();
      const u = c.user;
      if (!u) return false;
      if (
        !(u.nom?.toLowerCase().includes(q) ||
          u.prenom?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const countCommerciaux   = convs.filter(isCommercialConv).length;
  const countProprietaires = convs.filter(isProprioConv).length;
  const unreadCommerciaux   = convs.filter(isCommercialConv).reduce((s, c) => s + (c.unread_count ?? 0), 0);
  const unreadProprietaires = convs.filter(isProprioConv).reduce((s, c) => s + (c.unread_count ?? 0), 0);

  const activeConv = convs.find(c => c.id === activeId);
  const activeConvIsPropio = activeConv ? isProprioConv(activeConv) : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-h))' }}>

      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-text)' }}>
            Suivi des échanges
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-muted)' }}>
            Conversations des équipes · commerciaux &amp; propriétaires
          </p>
        </div>
        <div className="immo-spacer" />
        {totalUnread > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FEE2E2', borderRadius: 20, padding: '6px 14px',
            border: '1px solid #FECACA',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'sup-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>
              {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Corps deux colonnes ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ═══ Panel gauche — liste ═══ */}
        <div style={{
          width: 340, flexShrink: 0, borderRight: '1px solid var(--c-border)',
          display: 'flex', flexDirection: 'column', background: '#fff',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
            {([
              { key: 'commerciaux',   label: 'Commerciaux',   count: countCommerciaux,   unread: unreadCommerciaux },
              { key: 'proprietaires', label: 'Propriétaires', count: countProprietaires, unread: unreadProprietaires },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setActiveId(null); }}
                style={{
                  flex: 1, padding: '10px 8px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  color: activeTab === tab.key ? 'var(--c-blue)' : 'var(--c-muted)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--c-blue)' : '2px solid transparent',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10,
                    background: tab.unread > 0 ? '#DC2626' : '#F1F5F9',
                    color: tab.unread > 0 ? '#fff' : 'var(--c-muted)',
                  }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche + filtre */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)' }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="immo-form-input"
                style={{ paddingLeft: 30, height: 34, fontSize: 12 }}
                placeholder="Rechercher un client…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setUnreadOnly(v => !v)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${unreadOnly ? '#DC2626' : 'var(--c-border)'}`,
                background: unreadOnly ? '#FEE2E2' : 'transparent',
                color: unreadOnly ? '#DC2626' : 'var(--c-muted)',
                transition: 'all 0.15s', alignSelf: 'flex-start',
              }}
            >
              Non lus seulement {unreadOnly && `(${filtered.length})`}
            </button>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                Chargement…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                {unreadOnly ? 'Aucun message non lu.' : 'Aucune conversation.'}
              </div>
            ) : (
              filtered.map(conv => {
                const isActive  = conv.id === activeId;
                const unread    = conv.unread_count ?? 0;
                const claim     = claims[conv.id];
                const claimOther = claim && claim.name !== adminName;
                const u = conv.user;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConv(conv.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid var(--c-border)',
                      cursor: 'pointer',
                      background: isActive ? '#EFF6FF' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--c-blue)' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: u ? avatarColor(u.id ?? 0) : '#CBD5E1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff',
                      }}>
                        {u ? initials(u) : '?'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <span style={{
                            fontWeight: unread > 0 ? 700 : 600,
                            fontSize: 13, color: 'var(--c-text)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                          }}>
                            {displayName(u)}
                          </span>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                            {unread > 0 && (
                              <span style={{
                                background: '#DC2626', color: '#fff',
                                borderRadius: '50%', minWidth: 18, height: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, padding: '0 4px',
                              }}>{unread}</span>
                            )}
                            {conv.last_message_at && (
                              <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>
                                {fmtTime(conv.last_message_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Role + dernier message */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                          {u?.role && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, background: '#F1F5F9', color: '#64748B',
                              borderRadius: 3, padding: '1px 5px', letterSpacing: '0.4px', textTransform: 'uppercase', flexShrink: 0,
                            }}>{ROLE_LABELS[u.role_principal ?? u.role] ?? (u.role_principal ?? u.role)}</span>
                          )}
                          {conv.last_message && (
                            <span style={{
                              fontSize: 11, color: 'var(--c-muted)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {conv.last_message}
                            </span>
                          )}
                        </div>

                        {/* Claim indicator */}
                        {claimOther && (
                          <div style={{
                            fontSize: 10, color: '#D97706', fontWeight: 600, marginTop: 3,
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {claim.name} répond…
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ Panel droit — thread ═══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--c-bg)' }}>

          {activeId == null ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)' }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sélectionnez une conversation</div>
              <div style={{ fontSize: 12 }}>Les messages non lus sont triés en premier</div>
            </div>
          ) : (
            <>
              {/* Header thread */}
              {activeConv && (
                <div style={{
                  padding: '12px 20px', borderBottom: '1px solid var(--c-border)',
                  background: '#fff', display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: avatarColor(activeConv.user?.id ?? 0),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
                    }} onClick={() => setPopover(p => p === activeId ? null : activeId)}>
                      {initials(activeConv.user)}
                    </div>
                    {popover === activeId && activeConv.user && (
                      <ClientPopover user={activeConv.user} onClose={() => setPopover(null)} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
                      {displayName(activeConv.user)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 1 }}>
                      {activeConv.user?.email ?? ''}
                      {activeConv.user?.role && ` · ${ROLE_LABELS[activeConv.user.role_principal ?? activeConv.user.role] ?? ''}`}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {activeConvIsPropio ? (
                      <div style={{
                        fontSize: 11, color: '#7C3AED', fontWeight: 600,
                        background: '#F5F3FF', borderRadius: 6, padding: '3px 8px', border: '1px solid #DDD6FE',
                      }}>
                        Vue seule — conversation propriétaire-client
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 11, color: '#D97706', fontWeight: 600,
                        background: '#FEF3C7', borderRadius: 6, padding: '3px 8px', border: '1px solid #FDE68A',
                      }}>
                        Vous répondez à la place de {activeConv?.gestionnaire_name ?? 'commercial'}
                      </div>
                    )}
                    <button
                      onClick={() => loadConvs(true)}
                      title="Actualiser"
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: '1px solid var(--c-border)',
                        background: 'transparent', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {loadingMsgs ? (
                  <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Chargement…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Aucun message dans cette conversation.</div>
                ) : (
                  messages.map((msg: any, idx: number) => {
                    const isStaff = msg.sender_role === 'staff' || msg.sender_role === 'gestionnaire';
                    const isSystem = msg.type === 'systeme' || msg.sender_id == null;
                    const prevMsg = messages[idx - 1];
                    const showDate = !prevMsg || !sameDay(prevMsg.created_at, msg.created_at);

                    return (
                      <div key={msg.id ?? idx}>
                        {showDate && (
                          <div style={{ textAlign: 'center', margin: '12px 0 6px', fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>
                            {fmtDateSep(msg.created_at)}
                          </div>
                        )}
                        {isSystem ? (
                          <div style={{ textAlign: 'center', margin: '6px 0', fontSize: 11, color: 'var(--c-muted)', fontStyle: 'italic' }}>
                            {msg.contenu}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: isStaff ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                            <div style={{ maxWidth: '72%' }}>
                              {!isStaff && msg.expediteur && (
                                <div style={{ fontSize: 10, color: 'var(--c-muted)', marginBottom: 2, paddingLeft: 4 }}>
                                  {displayName(msg.expediteur)}
                                </div>
                              )}
                              <div style={{
                                background: isStaff ? 'var(--c-blue)' : '#fff',
                                color: isStaff ? '#fff' : 'var(--c-text)',
                                border: isStaff ? 'none' : '1px solid var(--c-border)',
                                borderRadius: isStaff ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                              }}>
                                {msg.contenu}
                              </div>
                              <div style={{
                                fontSize: 10, color: 'var(--c-muted)', marginTop: 2,
                                textAlign: isStaff ? 'right' : 'left', paddingLeft: isStaff ? 0 : 4, paddingRight: isStaff ? 4 : 0,
                              }}>
                                {fmtDateTime(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input — masqué pour les convs propriétaire (lecture seule) */}
              {activeConvIsPropio ? (
                <div style={{
                  padding: '12px 16px', borderTop: '1px solid var(--c-border)',
                  background: '#F5F3FF', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                    Lecture seule — les admins ne peuvent pas répondre dans les conversations propriétaire-client
                  </span>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px', borderTop: '1px solid var(--c-border)',
                  background: '#fff', display: 'flex', gap: 10, alignItems: 'flex-end',
                }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={`Répondre en tant que ${activeConv?.gestionnaire_name ?? 'commercial'}… · Entrée pour envoyer`}
                    rows={2}
                    style={{
                      flex: 1, resize: 'none', border: '1.5px solid var(--c-border)',
                      borderRadius: 12, padding: '10px 12px', fontSize: 13, color: 'var(--c-text)',
                      fontFamily: 'inherit', outline: 'none', lineHeight: 1.5,
                      background: 'var(--c-bg)', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--c-blue)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--c-border)')}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: !input.trim() || sending ? 'var(--c-border)' : 'var(--c-blue)',
                      color: '#fff', border: 'none', cursor: !input.trim() || sending ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.15s',
                    }}
                  >
                    {sending ? (
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'block' }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sup-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
