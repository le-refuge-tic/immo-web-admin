import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { getMessages } from '../../api/getMessages';
import { postMessage } from '../../api/postMessage';
import { SearchIcon, SendIcon, PlusIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import NewConversationModal from './NewConversationModal';

/* ─── Helpers ───────────────────────────────────────────────── */

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2', '#DC2626', '#0284C7'];
function avatarColor(id: number) { return COLORS[Math.abs(id ?? 0) % COLORS.length]; }
function initials(u: any) { return `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() || '?'; }

function formatConvTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604_800_000) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}
function formatMsgTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function formatDateSep(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const ROLE_LABELS: any = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
  admin:        'Administrateur',
  super_admin:  'Super Admin',
  commercial:   'Commercial',
};

/* ─── Composant Popover info utilisateur ───────────────────── */

function UserPopover({ user, onClose }: { user: any; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const role = user?.role_principal ?? user?.role ?? '';
  const roleLabel = ROLE_LABELS[role] ?? role;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="msg-user-popover">
      <div className="msg-user-popover-av" style={{ background: avatarColor(user?.id ?? 0) }}>
        {user ? initials(user) : '?'}
      </div>
      <div className="msg-user-popover-body">
        <div className="msg-user-popover-name">{user?.prenom} {user?.nom}</div>
        {roleLabel && <div className="msg-user-popover-role">{roleLabel}</div>}
        {user?.email    && <div className="msg-user-popover-info">✉ {user.email}</div>}
        {user?.telephone && <div className="msg-user-popover-info">📱 {user.telephone}</div>}
      </div>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────── */

export default function MessagesPage() {
  const { user: me }                    = useAuth();
  const [convs, setConvs]               = useState([] as any[]);
  const [activeId, setActiveId]         = useState(null as any);
  const [messages, setMessages]         = useState([] as any[]);
  const [search, setSearch]             = useState('');
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [popoverUser, setPopoverUser]   = useState<any>(null);
  const bottomRef                       = useRef(null as any);

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await getMessages.conversations();
      setConvs(res.data ?? res);
    } catch {
      setConvs([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const loadThread = useCallback(async (id: number) => {
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const res = await getMessages.thread(id);
      setMessages(res.data ?? res);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (activeId != null) loadThread(activeId);
  }, [activeId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || activeId == null || sending) return;
    setInput('');
    setSending(true);
    try {
      const msg = await postMessage.send(activeId, { contenu: text });
      setMessages(prev => [...prev, msg]);
      setConvs(prev => prev.map((c: any) =>
        c.id === activeId
          ? { ...c, last_message: text, last_message_at: new Date().toISOString() }
          : c
      ));
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleConvCreated = (conv: any) => {
    setShowNewModal(false);
    if (!convs.find((c: any) => c.id === conv.id)) setConvs(prev => [conv, ...prev]);
    setActiveId(conv.id);
  };

  const handleAvatarClick = (e: React.MouseEvent, user: any) => {
    e.stopPropagation();
    setPopoverUser(prev => prev?.id === user?.id ? null : user);
  };

  const activeConv = convs.find((c: any) => c.id === activeId);

  const filtered = search
    ? convs.filter((c: any) =>
        `${c.user?.nom ?? ''} ${c.user?.prenom ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
        (c.user?.email ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : convs;

  return (
    <div className="msg-layout" onClick={() => setPopoverUser(null)}>

      {/* ── Panel gauche ── */}
      <div className="msg-conv-panel">
        <div className="msg-conv-panel-header">
          <span className="msg-conv-panel-title">Messages</span>
          <span className="msg-conv-count-badge">{convs.length}</span>
        </div>

        <div className="msg-conv-search-row">
          <SearchIcon size={13} />
          <input
            className="msg-conv-search-input"
            placeholder="Rechercher une conversation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="msg-conv-list">
          {loadingConvs ? (
            <div className="msg-conv-placeholder">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="msg-conv-placeholder">Aucune conversation.</div>
          ) : filtered.map((c: any) => {
            const userRole = c.user?.role_principal ?? c.user?.role ?? '';
            const roleBadge = ROLE_LABELS[userRole];
            return (
              <div
                key={c.id}
                className={`msg-conv-item${activeId === c.id ? ' active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="msg-av" style={{ background: avatarColor(c.user?.id ?? c.id) }}>
                  {c.user ? initials(c.user) : '?'}
                </div>
                <div className="msg-conv-meta">
                  <div className="msg-conv-name-row">
                    <span className="msg-conv-name">
                      {c.user ? `${c.user.prenom} ${c.user.nom}` : `Conv. #${c.id}`}
                    </span>
                    {roleBadge && <span className="msg-conv-role-badge">{roleBadge}</span>}
                  </div>
                  <div className="msg-conv-preview">{c.last_message ?? 'Aucun message'}</div>
                </div>
                <div className="msg-conv-right">
                  {c.last_message_at && (
                    <span className="msg-conv-time">{formatConvTime(c.last_message_at)}</span>
                  )}
                  {c.unread_count > 0 && (
                    <span className="msg-unread-badge">{c.unread_count}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="msg-new-btn-wrap">
          <button className="msg-new-btn" onClick={() => setShowNewModal(true)}>
            <PlusIcon />
            Nouveau message
          </button>
        </div>
      </div>

      {/* ── Panel droit ── */}
      {!activeConv ? (
        <div className="msg-thread msg-thread-empty">
          <div className="msg-empty-state">
            <div className="msg-empty-icon">💬</div>
            <div className="msg-empty-title">Sélectionnez une conversation</div>
            <div className="msg-empty-sub">Choisissez un contact à gauche ou démarrez une nouvelle conversation.</div>
          </div>
        </div>
      ) : (
        <div className="msg-thread">

          {/* En-tête du fil */}
          <div className="msg-thread-header">
            <div
              className="msg-av msg-av--md msg-av--click"
              style={{ background: avatarColor(activeConv.user?.id ?? activeConv.id) }}
              onClick={e => handleAvatarClick(e, activeConv.user)}
            >
              {activeConv.user ? initials(activeConv.user) : '?'}
            </div>
            <div className="msg-thread-user-info">
              <div className="msg-thread-user-name">
                {activeConv.user ? `${activeConv.user.prenom} ${activeConv.user.nom}` : `Conv. #${activeConv.id}`}
              </div>
              <div className="msg-thread-user-sub">
                {ROLE_LABELS[activeConv.user?.role_principal ?? activeConv.user?.role] ?? activeConv.user?.role_principal ?? '—'}
                {activeConv.user?.email ? ` · ${activeConv.user.email}` : ''}
              </div>
            </div>
            <div className="msg-online-dot" title="En ligne" />
          </div>

          {/* Zone de messages */}
          <div className="msg-bubbles" onClick={() => setPopoverUser(null)}>
            {loadingMsgs ? (
              <div className="msg-spinner-wrap"><div className="msg-spinner" /></div>
            ) : messages.length === 0 ? (
              <div className="msg-empty-state" style={{ flex: 1 }}>
                <div className="msg-empty-icon" style={{ fontSize: '1.75rem' }}>✉️</div>
                <div className="msg-empty-sub">Aucun message dans cette conversation.</div>
              </div>
            ) : (
              messages.map((m: any, i: number) => {
                const isMine   = m.expediteur_id != null && m.expediteur_id === me?.id;
                const isSystem = m.sender_role === 'systeme';
                const isStaff  = m.sender_role === 'staff';
                const showDate = i === 0 || !sameDay(messages[i - 1].created_at, m.created_at);

                // Objet expéditeur réel — m.expediteur est retourné par le backend
                // pour TOUS les messages (locataire, propriétaire, staff, admin…)
                const sender: any = isMine
                  ? me
                  : (m.expediteur ?? activeConv.user ?? null);

                const senderColor = avatarColor(sender?.id ?? 0);
                const senderInit  = sender ? initials(sender) : '?';

                // Label nom/rôle pour un autre membre du staff
                const showStaffLabel = !isMine && isStaff && m.expediteur;
                const staffName = showStaffLabel
                  ? `${m.expediteur.prenom ?? ''} ${m.expediteur.nom ?? ''}`.trim()
                  : null;
                const staffRoleName = showStaffLabel && m.expediteur?.role
                  ? (ROLE_LABELS[m.expediteur.role] ?? m.expediteur.role)
                  : null;

                // Classe de bulle
                const bubbleClass = isMine ? 'mine' : isStaff ? 'staff' : 'theirs';

                return (
                  <Fragment key={m.id}>
                    {showDate && (
                      <div className="msg-date-sep">
                        <div className="msg-date-sep-line" />
                        <span className="msg-date-sep-label">{formatDateSep(m.created_at)}</span>
                        <div className="msg-date-sep-line" />
                      </div>
                    )}
                    {isSystem ? (
                      <div className="msg-system-row">
                        <span className="msg-system-label">{m.contenu}</span>
                      </div>
                    ) : (
                      <div className={`msg-bubble-row${isMine ? ' mine' : ''}`}>
                        {/* Avatar cliquable — affiché des DEUX côtés */}
                        <div
                          className="msg-av msg-av--sm msg-av--click"
                          style={{ background: senderColor }}
                          onClick={e => handleAvatarClick(e, sender)}
                          title={sender ? `${sender.prenom ?? ''} ${sender.nom ?? ''}`.trim() : ''}
                        >
                          {senderInit}
                        </div>

                        <div className="msg-bubble-col">
                          {showStaffLabel && staffName && (
                            <span className="msg-sender-label">
                              {staffName}
                              {staffRoleName && <span className="msg-sender-role"> · {staffRoleName}</span>}
                            </span>
                          )}
                          <div className={`msg-bubble ${bubbleClass}`}>
                            {m.contenu}
                          </div>
                          <span className="msg-bubble-time">{formatMsgTime(m.created_at)}</span>
                        </div>
                      </div>
                    )}
                  </Fragment>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Zone de saisie */}
          <div className="msg-input-area">
            <textarea
              className="msg-textarea"
              placeholder="Écrire un message… (Entrée pour envoyer, Shift+Entrée pour aller à la ligne)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="msg-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              title="Envoyer"
            >
              {sending ? <div className="msg-send-spinner" /> : <SendIcon size={15} />}
            </button>
          </div>

          {/* Popover info utilisateur */}
          {popoverUser && (
            <UserPopover user={popoverUser} onClose={() => setPopoverUser(null)} />
          )}
        </div>
      )}

      {/* Modal nouveau message */}
      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleConvCreated}
        />
      )}
    </div>
  );
}
