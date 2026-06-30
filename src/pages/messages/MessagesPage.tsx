import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { getMessages } from '../../api/getMessages';
import { postMessage } from '../../api/postMessage';
import { SearchIcon, SendIcon } from '../../components/Icons';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#16A34A', '#0891B2'];
function avatarColor(id: number) { return COLORS[Math.abs(id) % COLORS.length]; }
function initials(u: any) { return `${u.nom?.[0] ?? ''}${u.prenom?.[0] ?? ''}`.toUpperCase(); }

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
};

export default function MessagesPage() {
  const [convs, setConvs]               = useState([] as any[]);
  const [activeId, setActiveId]         = useState(null as any);
  const [messages, setMessages]         = useState([] as any[]);
  const [search, setSearch]             = useState('');
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const bottomRef                       = useRef(null as any);

  useEffect(() => {
    setLoadingConvs(true);
    getMessages.conversations()
      .then(res => setConvs(res.data ?? res))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = convs.find((c: any) => c.id === activeId);

  const filtered = search
    ? convs.filter((c: any) =>
        `${c.user?.nom ?? ''} ${c.user?.prenom ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
        (c.user?.email ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : convs;

  return (
    <div className="msg-layout">

      {/* ── Panel gauche : liste des conversations ── */}
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
          ) : filtered.map((c: any) => (
            <div
              key={c.id}
              className={`msg-conv-item${activeId === c.id ? ' active' : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              <div className="msg-av" style={{ background: avatarColor(c.user?.id ?? c.id) }}>
                {c.user ? initials(c.user) : '?'}
              </div>
              <div className="msg-conv-meta">
                <div className="msg-conv-name">
                  {c.user ? `${c.user.prenom} ${c.user.nom}` : `Conv. #${c.id}`}
                </div>
                <div className="msg-conv-preview">
                  {c.last_message ?? 'Aucun message'}
                </div>
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
          ))}
        </div>
      </div>

      {/* ── Panel droit : fil de discussion ── */}
      {!activeConv ? (
        <div className="msg-thread msg-thread-empty">
          <div className="msg-empty-state">
            <div className="msg-empty-icon">💬</div>
            <div className="msg-empty-title">Sélectionnez une conversation</div>
            <div className="msg-empty-sub">Choisissez un contact à gauche pour voir les messages.</div>
          </div>
        </div>
      ) : (
        <div className="msg-thread">

          {/* En-tête du fil */}
          <div className="msg-thread-header">
            <div className="msg-av msg-av--md" style={{ background: avatarColor(activeConv.user?.id ?? activeConv.id) }}>
              {activeConv.user ? initials(activeConv.user) : '?'}
            </div>
            <div className="msg-thread-user-info">
              <div className="msg-thread-user-name">
                {activeConv.user ? `${activeConv.user.prenom} ${activeConv.user.nom}` : `Conv. #${activeConv.id}`}
              </div>
              <div className="msg-thread-user-sub">
                {ROLE_LABELS[activeConv.user?.role] ?? activeConv.user?.role ?? '—'}
                {activeConv.user?.email ? ` · ${activeConv.user.email}` : ''}
              </div>
            </div>
            <div className="msg-online-dot" title="En ligne" />
          </div>

          {/* Zone de messages */}
          <div className="msg-bubbles">
            {loadingMsgs ? (
              <div className="msg-spinner-wrap">
                <div className="msg-spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div className="msg-empty-state" style={{ flex: 1 }}>
                <div className="msg-empty-icon" style={{ fontSize: '1.75rem' }}>✉️</div>
                <div className="msg-empty-sub">Aucun message dans cette conversation.</div>
              </div>
            ) : (
              messages.map((m: any, i: number) => {
                const isMine = m.sender_role === 'admin';
                const showDate = i === 0 || !sameDay(messages[i - 1].created_at, m.created_at);
                return (
                  <Fragment key={m.id}>
                    {showDate && (
                      <div className="msg-date-sep">
                        <div className="msg-date-sep-line" />
                        <span className="msg-date-sep-label">{formatDateSep(m.created_at)}</span>
                        <div className="msg-date-sep-line" />
                      </div>
                    )}
                    <div className={`msg-bubble-row${isMine ? ' mine' : ''}`}>
                      {!isMine && (
                        <div
                          className="msg-av msg-av--sm"
                          style={{ background: avatarColor(activeConv.user?.id ?? activeConv.id) }}
                        >
                          {activeConv.user ? initials(activeConv.user) : '?'}
                        </div>
                      )}
                      <div className={`msg-bubble${isMine ? ' mine' : ' theirs'}`}>
                        {m.contenu}
                      </div>
                      <span className="msg-bubble-time">{formatMsgTime(m.created_at)}</span>
                    </div>
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
              {sending ? (
                <div className="msg-send-spinner" />
              ) : (
                <SendIcon size={15} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
