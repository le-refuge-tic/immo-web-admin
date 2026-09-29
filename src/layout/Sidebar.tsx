import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GridIcon, HomeIcon, UsersIcon, SettingsIcon, ShieldIcon, AlertIcon,
  ChevronDownIcon, UserIcon, BuildingIcon, KeyIcon, FileTextIcon, TrendingUpIcon, StarIcon,
  MessageIcon, WithdrawIcon, ListingsIcon, VisitIcon, ClientsIcon, FlagIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getMessages, getActiveCommercialIds } from '../api/getMessages';
import { getAdminStats } from '../api/getAdminStats';
import { getQuartiers } from '../api/getQuartiers';
import { getMesBiens } from '../api/getMesBiens';
import axios from 'axios';
import { io } from 'socket.io-client';

const BASE_SIDEBAR = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const authSidebar = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

const SOCKET_BASE = (() => {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
})();

// ── Persistance des statuts vus pour les biens du commercial ──────────────────

const BIENS_SEEN_KEY = 'commercial_biens_seen';

function getSeenStatuts(): Record<number, string> {
  try {
    const raw = localStorage.getItem(BIENS_SEEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSeenStatuts(map: Record<number, string>) {
  try { localStorage.setItem(BIENS_SEEN_KEY, JSON.stringify(map)); } catch { /**/ }
}

export function markBiensAsSeen(biens: any[]) {
  const map: Record<number, string> = {};
  for (const b of biens) map[b.id] = b.statut_moderation;
  saveSeenStatuts(map);
  window.dispatchEvent(new CustomEvent('biens-seen'));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({
  minimized,
  mobileOpen,
}: {
  minimized: boolean;
  mobileOpen: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();

  const role         = user?.role_principal ?? user?.role ?? '';
  const isAdmin      = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isCommercial = role === 'commercial';

  const isConfigActive = location.pathname.startsWith('/configuration');
  const [configOpen, setConfigOpen] = useState(isConfigActive);
  const [unreadCount, setUnreadCount]         = useState(0);
  const [msgUnreadCount, setMsgUnreadCount]   = useState(0);
  const [moderationCount, setModerationCount] = useState(0);
  const [quartiersCount, setQuartiersCount]   = useState(0);
  const [retraitsCount, setRetraitsCount]     = useState(0);
  const [annoncesChanges, setAnnoncesChanges] = useState(0);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollMsgRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollBadgeRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAnnoncesRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Badge supervision messages (admins uniquement)
  useEffect(() => {
    if (!isAdmin) return;
    const load = () =>
      getMessages.supervision().then(r => {
        const activeIds = getActiveCommercialIds();
        const convs: any[] = r.data ?? [];
        const count = activeIds.size === 0
          ? (r.total_unread ?? 0)
          : convs
              .filter((c: any) => !c.gestionnaire_id || activeIds.has(c.gestionnaire_id))
              .reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
        setUnreadCount(count);
      }).catch(() => {});
    load();
    pollRef.current = setInterval(load, 20_000);
    const onConvRead = () => load();
    window.addEventListener('conv-read', onConvRead);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      window.removeEventListener('conv-read', onConvRead);
    };
  }, [isAdmin]);

  // Badge messages non lus (tous les rôles) — polling + socket global
  useEffect(() => {
    const loadMsg = () =>
      getMessages.conversations().then(r => {
        const convs: any[] = Array.isArray(r) ? r : (r.data ?? []);
        const count = convs.reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
        setMsgUnreadCount(count);
      }).catch(() => {});
    loadMsg();
    pollMsgRef.current = setInterval(loadMsg, 20_000);

    // Socket global pour mise à jour immédiate quand un message arrive
    const token = localStorage.getItem('access_token');
    let socket: ReturnType<typeof io> | null = null;
    if (token) {
      socket = io(`${SOCKET_BASE}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
      });
      socket.on('message', () => { loadMsg(); });
    }

    const onConvRead = () => loadMsg();
    window.addEventListener('conv-read', onConvRead);
    return () => {
      if (pollMsgRef.current) clearInterval(pollMsgRef.current);
      window.removeEventListener('conv-read', onConvRead);
      socket?.disconnect();
    };
  }, []);

  // Badges modération / quartiers / retraits (admins uniquement)
  useEffect(() => {
    if (!isAdmin) return;
    const loadBadges = async () => {
      try {
        const [stats, quartiers, retraitsRes] = await Promise.all([
          getAdminStats.get(),
          getQuartiers.lister('en_attente'),
          axios.get(`${BASE_SIDEBAR}/retraits/admin?statut=en_attente`, authSidebar()),
        ]);
        setModerationCount(stats?.biens_en_attente ?? 0);
        setQuartiersCount(Array.isArray(quartiers) ? quartiers.length : 0);
        const rd = retraitsRes.data;
        setRetraitsCount(Array.isArray(rd) ? rd.length : (rd?.data?.length ?? 0));
      } catch { /**/ }
    };
    loadBadges();
    pollBadgeRef.current = setInterval(loadBadges, 60_000);
    return () => { if (pollBadgeRef.current) clearInterval(pollBadgeRef.current); };
  }, [isAdmin]);

  // Badge "Mes annonces" — biens dont le statut a changé depuis la dernière visite (commerciaux)
  useEffect(() => {
    if (!isCommercial) return;

    const computeChanges = (biens: any[]) => {
      const seen = getSeenStatuts();
      // Si aucun bien jamais vu, on initialise silencieusement sans badge
      if (Object.keys(seen).length === 0) {
        const map: Record<number, string> = {};
        for (const b of biens) map[b.id] = b.statut_moderation;
        saveSeenStatuts(map);
        setAnnoncesChanges(0);
        return;
      }
      let changes = 0;
      for (const b of biens) {
        const prev = seen[b.id];
        // Nouveau bien jamais vu OU statut différent du dernier vu
        if (prev === undefined || prev !== b.statut_moderation) changes++;
      }
      setAnnoncesChanges(changes);
    };

    const load = () =>
      getMesBiens.list().then((biens: any[]) => computeChanges(biens ?? [])).catch(() => {});

    load();
    pollAnnoncesRef.current = setInterval(load, 60_000);

    // Quand l'utilisateur visite la page, effacer le badge
    const onBiensSeen = () => { setAnnoncesChanges(0); };
    window.addEventListener('biens-seen', onBiensSeen);

    return () => {
      if (pollAnnoncesRef.current) clearInterval(pollAnnoncesRef.current);
      window.removeEventListener('biens-seen', onBiensSeen);
    };
  }, [isCommercial]);

  const classes = [
    'immo-sidebar',
    minimized ? 'immo-sidebar--min' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const navItems = [
    ...(isAdmin      ? [{ to: '/dashboard',           label: 'Tableau de bord',  Icon: GridIcon     }] : []),
    ...(isCommercial ? [{ to: '/commercial-dashboard', label: 'Tableau de bord',  Icon: GridIcon     }] : []),
    ...(isAdmin ? [{ to: '/annonces', label: 'Annonces', Icon: HomeIcon }] : []),
    ...(isAdmin ? [{ to: '/moderation', label: 'Modération', Icon: AlertIcon }] : []),
    ...(isCommercial ? [
      { to: '/mes-annonces', label: 'Mes annonces',    Icon: ListingsIcon   },
      { to: '/mes-visites',  label: 'Mes visites',     Icon: VisitIcon      },
      { to: '/mes-clients',  label: 'Mes clients',     Icon: ClientsIcon    },
      { to: '/mon-equipe',   label: 'Mon équipe',      Icon: UsersIcon      },
    ] : []),
    { to: '/messages',     label: 'Messages',           Icon: MessageIcon    },
    ...(isAdmin ? [
      { to: '/supervision',  label: 'Suivi des échanges', Icon: ShieldIcon   },
      { to: '/utilisateurs', label: 'Utilisateurs',    Icon: UsersIcon      },
      { to: '/loyers',       label: 'Loyers',          Icon: FileTextIcon   },
      { to: '/liaisons',     label: 'Liaisons gestion',Icon: KeyIcon        },
      { to: '/finances',     label: 'Finances',        Icon: TrendingUpIcon },
      { to: '/feedbacks',    label: 'Feedbacks',       Icon: StarIcon       },
      { to: '/reclamations', label: 'Réclamations',    Icon: FlagIcon       },
    ] : []),
    ...(isAdmin ? [{ to: '/retraits', label: 'Retraits MoMo', Icon: WithdrawIcon }] : []),
    ...(isAdmin ? [{ to: '/quartiers', label: 'Quartiers', Icon: HomeIcon }] : []),
  ];

  const configSubs = [
    { to: '/configuration/profil', label: 'Mon profil', Icon: UserIcon },
    ...(isAdmin ? [
      { to: '/configuration/commerciaux',    label: 'Commerciaux',    Icon: UsersIcon    },
      { to: '/configuration/equipes',        label: 'Équipes',        Icon: UsersIcon    },
      { to: '/configuration/proprietaires',  label: 'Propriétaires',  Icon: BuildingIcon },
      { to: '/configuration/prospects',      label: 'Prospects',      Icon: UsersIcon    },
      { to: '/configuration/locataires',     label: 'Locataires',     Icon: KeyIcon      },
    ] : []),
    ...(isSuperAdmin ? [{ to: '/configuration/administrateurs', label: 'Administrateurs', Icon: ShieldIcon }] : []),
  ];

  return (
    <aside id="immo-sidebar" className={classes} aria-label="Navigation principale">
      <nav className="immo-nav">
        {navItems.map(({ to, label, Icon }) => {
          const isSupervision  = to === '/supervision';
          const isMessages     = to === '/messages';
          const isModeration   = to === '/moderation';
          const isQuartiers    = to === '/quartiers';
          const isRetraits     = to === '/retraits';
          const isMesAnnonces  = to === '/mes-annonces';
          const badge = isSupervision && unreadCount > 0
            ? unreadCount
            : isMessages && msgUnreadCount > 0
              ? msgUnreadCount
              : isModeration && moderationCount > 0
                ? moderationCount
                : isQuartiers && quartiersCount > 0
                  ? quartiersCount
                  : isRetraits && retraitsCount > 0
                    ? retraitsCount
                    : isMesAnnonces && annoncesChanges > 0
                      ? annoncesChanges
                      : 0;
          return (
            <NavLink
              key={to}
              to={to}
              title={minimized ? label : undefined}
              className={({ isActive }) => `immo-nav-item${isActive ? ' active' : ''}`}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: -5, right: -6,
                    background: '#DC2626', color: '#fff',
                    borderRadius: '50%', minWidth: 15, height: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, padding: '0 3px', lineHeight: 1,
                  }}>{badge > 99 ? '99+' : badge}</span>
                )}
              </span>
              <span className="immo-nav-label">{label}</span>
            </NavLink>
          );
        })}

        {/* Configuration collapsible */}
        <div className="config-group">
          <button
            className={`immo-nav-item config-toggle${isConfigActive ? ' active' : ''}`}
            onClick={() => !minimized && setConfigOpen(o => !o)}
            title={minimized ? 'Configuration' : undefined}
            aria-expanded={!minimized && configOpen}
            aria-controls="config-submenu"
          >
            <SettingsIcon />
            <span className="immo-nav-label">Configuration</span>
            <span className={`config-chevron${configOpen ? ' open' : ''}`}>
              <ChevronDownIcon />
            </span>
          </button>

          {configOpen && !minimized && (
            <div id="config-submenu" className="config-submenu">
              {configSubs.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `immo-nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon />
                  <span className="immo-nav-label">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Téléchargement de l'app mobile (APK) — visible seulement si l'URL est configurée */}
        {import.meta.env.VITE_APK_URL && (
          <a
            className="immo-nav-item"
            href={import.meta.env.VITE_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            download
            title={minimized ? "Télécharger l'app (APK)" : undefined}
            style={{ marginTop: 12, color: 'var(--c-blue)' }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="immo-nav-label">Télécharger l'app (APK)</span>
          </a>
        )}
      </nav>
    </aside>
  );
}
