import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessages } from '../../api/getMessages';
import { postMessage } from '../../api/postMessage';
import { useAuth } from '../../context/AuthContext';
import { useChatSocket } from '../../hooks/useChatSocket';
import NewConversationModal from './NewConversationModal';

/* ─── Helpers ─────────────────────────────────────────────────── */

const COLORS = ['#2563EB','#7C3AED','#DB2777','#D97706','#16A34A','#0891B2','#DC2626','#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) {
  if (!u) return '?';
  return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || (u.email?.[0]?.toUpperCase() ?? '?');
}
function displayName(u: any) {
  if (!u) return '—';
  return (u.prenom || u.nom) ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : (u.email ?? `#${u.id}`);
}
function fmtConvTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function fmtMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function fmtDateSep(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const ROLE_LABELS: Record<string, string> = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  admin:        'Admin',
  super_admin:  'Super Admin',
  commercial:   'Commercial',
};

/* ─── UserPopover ─────────────────────────────────────────────── */

function UserPopover({ user, onClose }: { user: any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const role = user?.role_principal ?? user?.role ?? '';

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 400,
      background: '#fff', border: '1px solid var(--c-border)', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)', padding: '14px 16px',
      minWidth: 220, marginTop: 8,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: avatarColor(user?.id ?? 0), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>
          {initials(user)}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)' }}>{displayName(user)}</div>
          {role && (
            <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', borderRadius: 20, padding: '1px 7px', display: 'inline-block', marginTop: 2 }}>
              {ROLE_LABELS[role] ?? role}
            </span>
          )}
        </div>
      </div>
      {user?.email    && <div style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 3 }}><strong style={{ color: 'var(--c-text)' }}>Email :</strong> {user.email}</div>}
      {user?.telephone && <div style={{ fontSize: 11, color: 'var(--c-muted)' }}><strong style={{ color: 'var(--c-text)' }}>Tel :</strong> {user.telephone}</div>}
    </div>
  );
}

/* ─── Page principale ─────────────────────────────────────────── */

export default function MessagesPage() {
  const { user: me }                    = useAuth();
  const [convs, setConvs]               = useState<any[]>([]);
  const [activeId, setActiveId]         = useState<number | null>(null);
  const [messages, setMessages]         = useState<any[]>([]);
  const [search, setSearch]             = useState('');
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [popover, setPopover]           = useState<{ user: any } | null>(null);
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const sendingRef                      = useRef(false);

  useChatSocket(activeId, (msg) => {
    if (msg.conversation_id === activeId) {
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    }
    setConvs(prev => prev.map((c: any) =>
      c.id === msg.conversation_id
        ? { ...c, last_message: msg.contenu, last_message_at: msg.created_at }
        : c
    ));
  });

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await getMessages.conversations();
      setConvs(res.data ?? res);
    } catch { setConvs([]); }
    finally { setLoadingConvs(false); }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const loadThread = useCallback(async (id: number) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await getMessages.thread(id);
      setMessages(res.data ?? res);
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  }, []);

  useEffect(() => {
    if (activeId != null) loadThread(activeId);
  }, [activeId, loadThread]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (sendingRef.current || !text || activeId == null) return;
    sendingRef.current = true;
    setSending(true);
    setInput('');
    try {
      const msg = await postMessage.send(activeId, { contenu: text });
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      setConvs(prev => prev.map((c: any) =>
        c.id === activeId ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c
      ));
    } catch { setInput(text); }
    finally { sendingRef.current = false; setSending(false); }
  };

  const handleConvCreated = (conv: any) => {
    setShowNewModal(false);
    if (!convs.find((c: any) => c.id === conv.id)) setConvs(prev => [conv, ...prev]);
    setActiveId(conv.id);
  };

  const activeConv = convs.find((c: any) => c.id === activeId);

  // Retourne l'interlocuteur : si je suis le client, l'autre est le gestionnaire, sinon l'autre est le client
  const otherUser = (c: any) => c.client_id === me?.id ? (c.gestionnaire_user ?? c.user) : c.user;

  const filtered = search
    ? convs.filter((c: any) => {
        const other = otherUser(c);
        return `${other?.nom ?? ''} ${other?.prenom ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
          (other?.email ?? '').toLowerCase().includes(search.toLowerCase());
      })
    : convs;

  const activeOther = activeConv ? otherUser(activeConv) : null;

  /* ─── Rendu ─────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-h, 60px))', overflow: 'hidden' }} onClick={() => setPopover(null)}>

      {/* ═══ Panel gauche — liste ═══ */}
      <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', background: '#fff' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--c-text)', flex: 1 }}>Messages</span>
          {convs.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, background: '#F1F5F9', color: 'var(--c-muted)', borderRadius: 20, padding: '2px 7px' }}>
              {convs.length}
            </span>
          )}
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
              placeholder="Rechercher une conversation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Liste conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-muted)', fontSize: 13 }}>Aucune conversation.</div>
          ) : filtered.map((c: any) => {
            const isActive = activeId === c.id;
            const unread = c.unread_count ?? 0;
            const other = otherUser(c);
            const role = other?.role_principal ?? other?.role ?? '';
            return (
              <div key={c.id} onClick={() => setActiveId(c.id)}
                style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--c-blue)' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: other ? avatarColor(other.id) : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {other ? initials(other) : '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: unread > 0 ? 700 : 600, fontSize: 13, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {other ? displayName(other) : `Conv. #${c.id}`}
                      </span>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                        {unread > 0 && <span style={{ background: '#DC2626', color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, padding: '0 4px' }}>{unread}</span>}
                        {c.last_message_at && <span style={{ fontSize: 10, color: 'var(--c-muted)' }}>{fmtConvTime(c.last_message_at)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                      {role && (
                        <span style={{ fontSize: 9, fontWeight: 700, background: '#F1F5F9', color: '#64748B', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' as const, flexShrink: 0 }}>
                          {ROLE_LABELS[role] ?? role}
                        </span>
                      )}
                      {c.last_message && (
                        <span style={{ fontSize: 11, color: 'var(--c-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.last_message}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nouveau message */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--c-border)' }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              width: '100%', padding: '8px 0', borderRadius: 8, border: '1.5px dashed var(--c-border)',
              background: 'transparent', color: 'var(--c-blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nouveau message
          </button>
        </div>
      </div>

      {/* ═══ Panel droit — thread ═══ */}
      {!activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', background: 'var(--c-bg)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14, opacity: 0.4 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Sélectionnez une conversation</div>
          <div style={{ fontSize: 12 }}>Ou démarrez une nouvelle discussion ci-contre.</div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header thread */}
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--c-border)', background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{ width: 40, height: 40, borderRadius: '50%', background: avatarColor(activeOther?.id ?? activeConv.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
                onClick={e => { e.stopPropagation(); setPopover(p => p?.user?.id === activeOther?.id ? null : { user: activeOther }); }}
              >
                {activeOther ? initials(activeOther) : '?'}
              </div>
              {popover && popover.user?.id === activeOther?.id && (
                <UserPopover user={popover.user} onClose={() => setPopover(null)} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeOther ? displayName(activeOther) : `Conv. #${activeConv.id}`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 1 }}>
                {ROLE_LABELS[activeOther?.role_principal ?? activeOther?.role] ?? ''}
                {activeOther?.email ? ` · ${activeOther.email}` : ''}
              </div>
            </div>
            <button
              onClick={loadConvs}
              title="Actualiser"
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--c-border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-muted)', flexShrink: 0 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--c-bg)' }} onClick={() => setPopover(null)}>
            {loadingMsgs ? (
              <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Chargement…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--c-muted)', fontSize: 13, paddingTop: 40 }}>Aucun message dans cette conversation.</div>
            ) : (
              messages.map((m: any, i: number) => {
                const isMine   = m.expediteur_id != null && m.expediteur_id === me?.id;
                const isSystem = m.sender_role === 'systeme';
                const showDate = i === 0 || !sameDay(messages[i - 1].created_at, m.created_at);

                return (
                  <div key={m.id ?? i}>
                    {showDate && (
                      <div style={{ textAlign: 'center', margin: '10px 0 6px', fontSize: 11, color: 'var(--c-muted)', fontWeight: 600 }}>
                        {fmtDateSep(m.created_at)}
                      </div>
                    )}
                    {isSystem ? (
                      <div style={{ textAlign: 'center', margin: '4px 0', fontSize: 11, color: 'var(--c-muted)', fontStyle: 'italic' }}>
                        {m.contenu}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{
                            background: isMine ? 'var(--c-blue)' : '#fff',
                            color: isMine ? '#fff' : 'var(--c-text)',
                            border: isMine ? 'none' : '1px solid var(--c-border)',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}>
                            {m.contenu}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--c-muted)', marginTop: 3, textAlign: isMine ? 'right' : 'left', paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                            {fmtMsgTime(m.created_at)}
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

          {/* Input */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--c-border)', background: '#fff', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              className="immo-form-input"
              style={{ flex: 1 }}
              placeholder="Écrire un message… (Entrée pour envoyer)"
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
                transition: 'background 0.15s',
              }}
            >
              {sending ? '…' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}

      {/* Modal nouveau message */}
      {showNewModal && (
        <NewConversationModal onClose={() => setShowNewModal(false)} onCreated={handleConvCreated} />
      )}
    </div>
  );
}
