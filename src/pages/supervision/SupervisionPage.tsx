import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessages } from '../../api/getMessages';
import { supervisionApi } from '../../api/commercialSupervisionApi';
import { getCommerciaux } from '../../api/getCommerciaux';
import { getAdminUser } from '../../api/getAdminUser';
import { useAuth } from '../../context/AuthContext';

/* ─── Constants ─────────────────────────────────────────────── */

const POLL_LIST_MS = 15_000;
const POLL_MSGS_MS =  5_000;
const CLAIM_TTL_MS = 5 * 60_000;
const CLAIM_PREFIX = 'sup_claim_';

const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#16A34A','#0891B2','#DC2626','#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) {
  if (!u) return '?';
  if (typeof u === 'string') return u[0]?.toUpperCase() ?? '?';
  return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0]?.toUpperCase() ?? '?');
}
function displayName(u: any) {
  if (!u) return '—';
  if (typeof u === 'string') return u;
  return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? u.telephone ?? `#${u.id}`);
}
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

const TYPE_LABEL_MAP: Record<string, string> = {
  'chambre-salon': 'Chambre-salon',
  'studio': 'Studio',
  'appartement': 'Appartement',
  'maison': 'Maison',
  'villa': 'Villa',
  'duplex': 'Duplex',
  'entree-coucher': 'Entrée coucher',
  'bureau': 'Bureau',
  'commerce': 'Commerce',
  'terrain': 'Terrain',
  'entrepot': 'Entrepôt',
};
const MOD_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  approuve:   { label: 'Publié',     color: '#16A34A', bg: '#F0FDF4' },
  en_attente: { label: 'En attente', color: '#D97706', bg: '#FFFBEB' },
  rejete:     { label: 'Rejeté',     color: '#DC2626', bg: '#FEF2F2' },
};

/* ─── Claim helpers ─────────────────────────────────────────── */

function setClaim(convId: number, adminName: string) {
  try { localStorage.setItem(`${CLAIM_PREFIX}${convId}`, JSON.stringify({ name: adminName, at: Date.now() })); } catch { /**/ }
}
function clearClaim(convId: number) {
  try { localStorage.removeItem(`${CLAIM_PREFIX}${convId}`); } catch { /**/ }
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

/* ─── ClientPopover ─────────────────────────────────────────── */

function ClientPopover({ user, onClose }: { user: any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
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
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: avatarColor(user?.id ?? 0), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
          {initials(user)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{displayName(user)}</div>
        </div>
      </div>
      {user?.email && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 3 }}><strong style={{ color: 'var(--c-text)' }}>Email :</strong> {user.email}</div>}
      {user?.telephone && <div style={{ fontSize: 11, color: 'var(--c-muted)' }}><strong style={{ color: 'var(--c-text)' }}>Tel :</strong> {user.telephone}</div>}
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */

export default function SupervisionPage() {
  const { user: me } = useAuth();
  const adminName = me ? displayName(me) : 'Admin';

  /* — état gauche — */
  const [tab, setTab]                     = useState<'commerciaux' | 'proprietaires'>('commerciaux');
  const [commerciaux, setCommerciaux]     = useState<any[]>([]);
  const [proprietairesFromApi, setProprietairesFromApi] = useState<any[]>([]);
  const [loadingProprios, setLoadingProprios] = useState(false);
  const [allConvs, setAllConvs]           = useState<any[]>([]);
  const [totalUnread, setTotalUnread]     = useState(0);
  const [loadingLeft, setLoadingLeft]     = useState(true);
  const [search, setSearch]               = useState('');

  /* — état personne sélectionnée — */
  const [selectedPerson, setSelectedPerson]           = useState<{ type: 'commercial' | 'proprietaire'; data: any } | null>(null);
  const [innerTab, setInnerTab]                       = useState<'conversations' | 'biens'>('conversations');
  const [personConvs, setPersonConvs]                 = useState<any[]>([]);
  const [personBiens, setPersonBiens]                 = useState<any[]>([]);
  const [loadingPersonConvs, setLoadingPersonConvs]   = useState(false);
  const [loadingPersonBiens, setLoadingPersonBiens]   = useState(false);

  /* — état conversation — */
  const [openConv, setOpenConv]         = useState<any | null>(null);
  const [thread, setThread]             = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [deletingMsg, setDeletingMsg]   = useState<number | null>(null);
  const [hoveredMsg, setHoveredMsg]     = useState<number | null>(null);
  const [claims, setClaims]             = useState<Record<number, { name: string; at: number }>>({});
  const [popover, setPopover]           = useState<number | null>(null);

  const bottomRef     = useRef<HTMLDivElement>(null);
  const listPollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const threadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Load commerciaux ── */
  useEffect(() => {
    getCommerciaux.list()
      .then(data => setCommerciaux(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => {})
      .finally(() => setLoadingLeft(false));
  }, []);

  /* ── Load propriétaires depuis l'API quand onglet actif ── */
  useEffect(() => {
    if (tab !== 'proprietaires') return;
    setLoadingProprios(true);
    getAdminUser.list({ role: 'proprietaire', limit: 200 })
      .then(res => setProprietairesFromApi(Array.isArray(res) ? res : (res?.data ?? [])))
      .catch(() => setProprietairesFromApi([]))
      .finally(() => setLoadingProprios(false));
  }, [tab]);

  /* ── Load all convs (unread + propriétaires) ── */
  const loadAllConvs = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingLeft(true);
    try {
      const res = await getMessages.supervision();
      setAllConvs(res.data);
      setTotalUnread(res.total_unread);
    } catch { /**/ }
    finally { if (!quiet) setLoadingLeft(false); }
  }, []);

  useEffect(() => {
    loadAllConvs();
    listPollRef.current = setInterval(() => loadAllConvs(true), POLL_LIST_MS);
    return () => { if (listPollRef.current) clearInterval(listPollRef.current); };
  }, [loadAllConvs]);

  /* ── Load conversations de la personne sélectionnée ── */
  useEffect(() => {
    if (!selectedPerson) return;
    setPersonConvs([]);
    setPersonBiens([]);
    setOpenConv(null);
    setInnerTab('conversations');
    setLoadingPersonConvs(true);
    const apiCall = selectedPerson.type === 'commercial'
      ? supervisionApi.getConversations(selectedPerson.data.id)
      : supervisionApi.getProprietaireConversations(selectedPerson.data.id);
    apiCall
      .then(data => setPersonConvs(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => setPersonConvs([]))
      .finally(() => setLoadingPersonConvs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPerson?.type, selectedPerson?.data?.id]);

  /* ── Load biens quand onglet biens ── */
  useEffect(() => {
    if (!selectedPerson || selectedPerson.type !== 'commercial' || innerTab !== 'biens' || personBiens.length > 0) return;
    setLoadingPersonBiens(true);
    supervisionApi.getBiens(selectedPerson.data.id)
      .then(data => setPersonBiens(Array.isArray(data) ? data : (data?.data ?? [])))
      .catch(() => setPersonBiens([]))
      .finally(() => setLoadingPersonBiens(false));
  }, [selectedPerson?.data?.id, innerTab, personBiens.length]);

  /* ── Load thread ── */
  const loadThread = useCallback(async (id: number, quiet = false) => {
    if (!quiet) { setLoadingThread(true); setThread([]); }
    try {
      const res = await supervisionApi.getMessages(id, { limit: 100 });
      setThread(res.data ?? res);
    } catch { /**/ }
    finally { if (!quiet) setLoadingThread(false); }
  }, []);

  useEffect(() => {
    if (!openConv) return;
    loadThread(openConv.id);
    if (threadPollRef.current) clearInterval(threadPollRef.current);
    threadPollRef.current = setInterval(() => loadThread(openConv.id, true), POLL_MSGS_MS);
    return () => { if (threadPollRef.current) clearInterval(threadPollRef.current); };
  }, [openConv?.id, loadThread]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  /* ── Claims ── */
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

  function openConversation(conv: any) {
    if (openConv) clearClaim(openConv.id);
    setOpenConv(conv);
    setInput('');
    if (selectedPerson?.type === 'commercial') {
      setClaim(conv.id, adminName);
      syncClaims();
    }
    setPersonConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
  }

  useEffect(() => { return () => { if (openConv) clearClaim(openConv.id); }; }, [openConv?.id]);

  async function handleSend() {
    if (!openConv || !input.trim() || sending || selectedPerson?.type === 'proprietaire') return;
    const text = input.trim();
    setInput('');
    setSending(true);
    try {
      const msg = await supervisionApi.replyAsCommercial(openConv.id, text);
      setThread(prev => [...prev, msg]);
      setPersonConvs(prev => prev.map(c => c.id === openConv.id ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c));
    } catch { setInput(text); }
    finally { setSending(false); }
  }

  async function handleDeleteMessage(msgId: number) {
    if (!openConv) return;
    if (!window.confirm('Supprimer ce message ? L\'utilisateur sera informé que son message a été supprimé par l\'administrateur.')) return;
    setDeletingMsg(msgId);
    try {
      await supervisionApi.deleteMessage(openConv.id, msgId);
      setThread(prev => prev.map(m => m.id === msgId ? { ...m, supprime_pour_tous: true } : m));
    } catch { /**/ } finally { setDeletingMsg(null); }
  }

  /* ── Données dérivées ── */

  // Unread par commercial
  const commercialUnread: Record<number, number> = {};
  allConvs.forEach(c => {
    if (c.gestionnaire_id) commercialUnread[c.gestionnaire_id] = (commercialUnread[c.gestionnaire_id] ?? 0) + (c.unread_count ?? 0);
  });

  const q = search.toLowerCase();
  const filteredCommerciaux = q
    ? commerciaux.filter(c => displayName(c).toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
    : commerciaux;
  const filteredProprietaires = q
    ? proprietairesFromApi.filter(p => displayName(p).toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q))
    : proprietairesFromApi;

  const isProprioView = selectedPerson?.type === 'proprietaire';

  /* ─── Rendu ─────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-h, 60px))' }}>

      {/* Topbar */}
      <div className="immo-topbar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-text)' }}>Suivi des échanges</h1>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--c-muted)' }}>Conversations des équipes · commerciaux &amp; propriétaires</p>
        </div>
        <div className="immo-spacer" />
        {totalUnread > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', borderRadius: 20, padding: '6px 14px', border: '1px solid #FECACA' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'sup-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#DC2626' }}>
              {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Corps */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ═══ Panel gauche ═══ */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* Tabs commerciaux / propriétaires */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)' }}>
            {([
              { key: 'commerciaux',   label: 'Commerciaux',   count: commerciaux.length,          unread: Object.values(commercialUnread).reduce((s, v) => s + v, 0) },
              { key: 'proprietaires', label: 'Propriétaires', count: proprietairesFromApi.length,  unread: 0 },
            ] as const).map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSelectedPerson(null); setOpenConv(null); setSearch(''); }}
                style={{
                  flex: 1, padding: '10px 6px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  color: tab === t.key ? 'var(--c-blue)' : 'var(--c-muted)',
                  borderBottom: tab === t.key ? '2px solid var(--c-blue)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10,
                    background: t.unread > 0 ? '#DC2626' : '#F1F5F9',
                    color: t.unread > 0 ? '#fff' : 'var(--c-muted)',
                  }}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-border)' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)' }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="immo-form-input"
                style={{ paddingLeft: 28, height: 32, fontSize: 12 }}
                placeholder={tab === 'commerciaux' ? 'Rechercher un commercial…' : 'Rechercher un propriétaire…'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tab === 'commerciaux' ? (
              loadingLeft ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
              ) : filteredCommerciaux.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucun commercial.</div>
              ) : filteredCommerciaux.map(c => {
                const isActive = selectedPerson?.type === 'commercial' && selectedPerson.data.id === c.id;
                const unread = commercialUnread[c.id] ?? 0;
                return (
                  <div key={c.id} onClick={() => setSelectedPerson({ type: 'commercial', data: c })}
                    style={{
                      padding: '11px 14px', borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
                      background: isActive ? '#EFF6FF' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--c-blue)' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#16A34A,#15803D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {initials(c)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName(c)}
                          </span>
                          {unread > 0 && (
                            <span style={{ background: '#DC2626', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, padding: '0 4px', flexShrink: 0 }}>
                              {unread}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.email ?? '—'}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                          {c.nb_clients > 0 && <span style={{ fontSize: 9, background: '#EFF6FF', color: '#2563EB', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>{c.nb_clients} clients</span>}
                          {c.nb_biens   > 0 && <span style={{ fontSize: 9, background: '#FFF7ED', color: '#D97706', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>{c.nb_biens} biens</span>}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                );
              })
            ) : (
              loadingProprios ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
              ) : filteredProprietaires.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>
                  Aucun propriétaire enregistré.
                </div>
              ) : filteredProprietaires.map(p => {
                const isActive = selectedPerson?.type === 'proprietaire' && selectedPerson.data.id === p.id;
                return (
                  <div key={p.id} onClick={() => setSelectedPerson({ type: 'proprietaire', data: p })}
                    style={{
                      padding: '11px 14px', borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
                      background: isActive ? '#F5F3FF' : 'transparent',
                      borderLeft: isActive ? '3px solid #7C3AED' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: avatarColor(p.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {initials(p)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName(p)}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>
                          {p.email ?? '—'}
                        </div>
                      </div>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ Panel droit ═══ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--c-bg)' }}>

          {!selectedPerson ? (
            /* État vide */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, opacity: 0.4 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                Sélectionnez un {tab === 'commerciaux' ? 'commercial' : 'propriétaire'}
              </div>
              <div style={{ fontSize: 12 }}>Pour voir ses conversations et intervenir</div>
            </div>

          ) : openConv ? (
            /* ─── Vue thread ─────────────────────────────────────── */
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--c-border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button onClick={() => { setOpenConv(null); if (openConv) clearClaim(openConv.id); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-blue)', padding: 4 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                {(() => {
                  const convOther = isProprioView
                    ? (openConv.gestionnaire_id === selectedPerson?.data?.id ? openConv.user : (openConv.gestionnaire_user ?? openConv.user))
                    : openConv.user;
                  return (
                    <>
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{ width: 36, height: 36, borderRadius: '50%', background: avatarColor(convOther?.id ?? 0), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                          onClick={() => setPopover(p => p === openConv.id ? null : openConv.id)}
                        >
                          {initials(convOther)}
                        </div>
                        {popover === openConv.id && convOther && (
                          <ClientPopover user={convOther} onClose={() => setPopover(null)} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>
                          {displayName(convOther)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-muted)' }}>
                          {convOther?.email ?? ''}
                        </div>
                      </div>
                    </>
                  );
                })()}
                <div style={{ marginLeft: 'auto' }}>
                  {isProprioView ? (
                    <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, background: '#F5F3FF', borderRadius: 6, padding: '3px 8px', border: '1px solid #DDD6FE' }}>
                      Vue seule — proprio-client
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600, background: '#FEF3C7', borderRadius: 6, padding: '3px 8px', border: '1px solid #FDE68A' }}>
                      Vous répondez en tant que {selectedPerson?.data?.prenom ?? 'commercial'}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {loadingThread ? (
                  <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Chargement…</div>
                ) : thread.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Aucun message.</div>
                ) : (
                  thread.map((msg: any, idx: number) => {
                    const isStaff = msg.sender_role === 'staff' || msg.sender_role === 'gestionnaire';
                    const isSystem = msg.type === 'systeme' || msg.sender_role === 'systeme';
                    const isSuppressed = msg.supprime_pour_tous === true;
                    const prevMsg = thread[idx - 1];
                    const showDate = !prevMsg || !sameDay(prevMsg.created_at, msg.created_at);
                    const showTrash = isProprioView && !isSuppressed && hoveredMsg === msg.id;
                    const senderName = isStaff
                      ? displayName(openConv.gestionnaire_user ?? selectedPerson?.data)
                      : displayName(openConv.user);
                    return (
                      <div key={msg.id ?? idx}
                        onMouseEnter={() => isProprioView && msg.id && setHoveredMsg(msg.id)}
                        onMouseLeave={() => setHoveredMsg(null)}
                      >
                        {showDate && (
                          <div style={{ textAlign: 'center', margin: '10px 0 6px', fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>
                            {fmtDateSep(msg.created_at)}
                          </div>
                        )}
                        {isSystem ? (
                          <div style={{ textAlign: 'center', margin: '4px 0', fontSize: 11, color: 'var(--c-muted)', fontStyle: 'italic' }}>{msg.contenu}</div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: isStaff ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 4, marginBottom: 2 }}>
                            {/* Bouton supprimer à gauche des bulles droites (staff) */}
                            {showTrash && isStaff && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                disabled={deletingMsg === msg.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#DC2626', opacity: 0.7, flexShrink: 0 }}
                                title="Supprimer ce message"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                            <div style={{ maxWidth: '70%' }}>
                              {!isSystem && (
                                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 2, textAlign: isStaff ? 'right' : 'left', paddingLeft: isStaff ? 0 : 4, paddingRight: isStaff ? 4 : 0 }}>
                                  {senderName}
                                </div>
                              )}
                              <div style={{
                                background: isSuppressed ? 'var(--c-bg)' : (isStaff ? 'var(--c-blue)' : '#fff'),
                                color: isSuppressed ? 'var(--c-muted)' : (isStaff ? '#fff' : 'var(--c-text)'),
                                border: isSuppressed ? '1px dashed var(--c-border)' : (isStaff ? 'none' : '1px solid var(--c-border)'),
                                borderRadius: isStaff ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                padding: '8px 12px', fontSize: isSuppressed ? 12 : 13, lineHeight: 1.5,
                                boxShadow: isSuppressed ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                                fontStyle: isSuppressed ? 'italic' : 'normal',
                              }}>
                                {isSuppressed ? 'Message supprimé par l\'administrateur' : msg.contenu}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 2, textAlign: isStaff ? 'right' : 'left', paddingLeft: isStaff ? 0 : 4, paddingRight: isStaff ? 4 : 0 }}>
                                {fmtDateTime(msg.created_at)}
                              </div>
                            </div>
                            {/* Bouton supprimer à droite des bulles gauches (client) */}
                            {showTrash && !isStaff && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                disabled={deletingMsg === msg.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#DC2626', opacity: 0.7, flexShrink: 0 }}
                                title="Supprimer ce message"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {isProprioView ? (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--c-border)', background: '#F5F3FF', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                    Lecture seule · survolez un message pour le supprimer
                  </span>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--c-border)', background: '#fff', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <input
                    className="immo-form-input"
                    style={{ flex: 1 }}
                    placeholder={`Répondre en tant que ${selectedPerson?.data?.prenom ?? 'commercial'}…`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    style={{
                      padding: '0 16px', height: 38, borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: !input.trim() || sending ? 'var(--c-border)' : 'var(--c-blue)',
                      color: '#fff', fontWeight: 600, fontSize: 13, flexShrink: 0,
                    }}
                  >
                    {sending ? '…' : 'Envoyer'}
                  </button>
                </div>
              )}
            </>

          ) : (
            /* ─── Vue profil + liste convs ─────────────────────── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff' }}>

              {/* Header profil */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: isProprioView ? avatarColor(selectedPerson.data.id) : 'linear-gradient(135deg,#16A34A,#15803D)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: '#fff',
                  }}>
                    {initials(selectedPerson.data)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--c-text)' }}>
                        {displayName(selectedPerson.data)}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: isProprioView ? '#F5F3FF' : '#F0FDF4',
                        color: isProprioView ? '#7C3AED' : '#16A34A',
                        border: `1px solid ${isProprioView ? '#DDD6FE' : '#BBF7D0'}`,
                        textTransform: 'uppercase' as const,
                      }}>
                        {isProprioView ? 'Propriétaire' : 'Commercial'}
                      </span>
                    </div>
                    {selectedPerson.data.email && (
                      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 3 }}>{selectedPerson.data.email}</div>
                    )}
                    {!isProprioView && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--c-muted)', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                          {selectedPerson.data.nb_clients ?? 0} clients
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--c-muted)', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                          {selectedPerson.data.nb_biens ?? 0} biens
                        </span>
                      </div>
                    )}
                    {isProprioView && personConvs.length > 0 && (
                      <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 3 }}>
                        {personConvs.length} conversation{personConvs.length > 1 ? 's' : ''} avec des commerciaux
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Inner tabs (commercial only) */}
              {!isProprioView && (
                <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', flexShrink: 0, padding: '0 20px' }}>
                  {([
                    { key: 'conversations', label: 'Conversations', count: personConvs.length },
                    { key: 'biens',         label: 'Biens publiés', count: selectedPerson.data.nb_biens ?? 0 },
                  ] as const).map(t => (
                    <button key={t.key} onClick={() => setInnerTab(t.key)}
                      style={{
                        padding: '10px 0', marginRight: 24, background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700,
                        color: innerTab === t.key ? 'var(--c-blue)' : 'var(--c-muted)',
                        borderBottom: innerTab === t.key ? '2px solid var(--c-blue)' : '2px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {t.label}
                      {t.count > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: '#F1F5F9', color: 'var(--c-muted)', borderRadius: 20, padding: '1px 6px' }}>{t.count}</span>}
                    </button>
                  ))}
                </div>
              )}

              {/* Liste convs */}
              {(innerTab === 'conversations' || isProprioView) && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingPersonConvs ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
                  ) : personConvs.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucune conversation.</div>
                  ) : personConvs.map((conv: any) => {
                    // Pour un proprio, l'interlocuteur est le client si le proprio est gestionnaire,
                    // ou le gestionnaire si le proprio est le client
                    const u = isProprioView
                      ? (conv.gestionnaire_id === selectedPerson?.data?.id ? conv.user : (conv.gestionnaire_user ?? conv.user))
                      : conv.user;
                    const unread = conv.unread_count ?? 0;
                    const claim = claims[conv.id];
                    const claimOther = claim && claim.name !== adminName;
                    return (
                      <div key={conv.id} onClick={() => openConversation(conv)}
                        style={{ padding: '12px 20px', borderBottom: '1px solid var(--c-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: u ? avatarColor(u.id ?? 0) : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                            {u ? initials(u) : '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: unread > 0 ? 700 : 600, fontSize: 13, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {u ? displayName(u) : `Conv. #${conv.id}`}
                              </span>
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                                {unread > 0 && <span style={{ background: '#DC2626', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, padding: '0 4px' }}>{unread}</span>}
                                {conv.last_message_at && <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{fmtTime(conv.last_message_at)}</span>}
                              </div>
                            </div>
                            {conv.last_message && (
                              <div style={{ fontSize: 11, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                                {conv.last_message}
                              </div>
                            )}
                            {claimOther && (
                              <div style={{ fontSize: 10, color: '#D97706', fontWeight: 600, marginTop: 2 }}>
                                {claim.name} répond…
                              </div>
                            )}
                          </div>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ alignSelf: 'center', flexShrink: 0 }}>
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Onglet Biens */}
              {innerTab === 'biens' && !isProprioView && (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loadingPersonBiens ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
                  ) : personBiens.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucun bien publié.</div>
                  ) : personBiens.map((b: any) => {
                    const sousType = b.amenites?.sous_type;
                    const label = TYPE_LABEL_MAP[sousType] ?? TYPE_LABEL_MAP[b.type] ?? b.type;
                    const mod = MOD_LABELS[b.statut_moderation] ?? { label: b.statut_moderation, color: '#6B7280', bg: '#F3F4F6' };
                    const proprio = b.amenites?.proprietaire_info;
                    return (
                      <div key={b.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--c-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{label}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: mod.bg, color: mod.color, border: `1px solid ${mod.color}33` }}>{mod.label}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'var(--c-bg)', color: 'var(--c-muted)', border: '1px solid var(--c-border)' }}>
                            {b.transaction === 'location' ? 'Location' : 'Vente'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 4 }}>
                          {b.localisation?.ville ?? ''}{b.localisation?.quartier ? ` · ${b.localisation.quartier}` : ''}
                          {' · '}<strong style={{ color: 'var(--c-text)' }}>{new Intl.NumberFormat('fr-FR').format(b.prix)} FCFA</strong>
                        </div>
                        {proprio && (
                          <div style={{ marginTop: 4, fontSize: 11, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 8px', display: 'inline-block' }}>
                            Proprio : {proprio.prenom ?? ''} {proprio.nom ?? ''}{proprio.telephone ? ` · ${proprio.telephone}` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sup-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)} }
      `}</style>
    </div>
  );
}
