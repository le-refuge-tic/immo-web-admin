import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GridIcon, HomeIcon, UsersIcon, SettingsIcon, ShieldIcon,
  ChevronDownIcon, UserIcon, BuildingIcon, KeyIcon, FileTextIcon, TrendingUpIcon, StarIcon,
  MessageIcon, WithdrawIcon, ListingsIcon, VisitIcon, ClientsIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../api/getMessages';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const load = () =>
      getMessages.supervision().then(r => setUnreadCount(r.total_unread)).catch(() => {});
    load();
    pollRef.current = setInterval(load, 20_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isAdmin]);

  const classes = [
    'immo-sidebar',
    minimized ? 'immo-sidebar--min' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const navItems = [
    ...(isAdmin      ? [{ to: '/dashboard',           label: 'Tableau de bord',  Icon: GridIcon     }] : []),
    ...(isCommercial ? [{ to: '/commercial-dashboard', label: 'Tableau de bord',  Icon: GridIcon     }] : []),
    { to: '/annonces',     label: 'Annonces',           Icon: HomeIcon       },
    ...(isCommercial ? [
      { to: '/mes-annonces', label: 'Mes annonces',    Icon: ListingsIcon   },
      { to: '/mes-visites',  label: 'Mes visites',     Icon: VisitIcon      },
      { to: '/mes-clients',  label: 'Mes clients',     Icon: ClientsIcon    },
    ] : []),
    { to: '/messages',     label: 'Messages',           Icon: MessageIcon    },
    ...(isAdmin ? [
      { to: '/supervision',  label: 'Supervision',     Icon: ShieldIcon     },
      { to: '/utilisateurs', label: 'Utilisateurs',    Icon: UsersIcon      },
      { to: '/loyers',       label: 'Loyers',          Icon: FileTextIcon   },
      { to: '/liaisons',     label: 'Liaisons gestion',Icon: KeyIcon        },
      { to: '/finances',     label: 'Finances',        Icon: TrendingUpIcon },
      { to: '/feedbacks',    label: 'Feedbacks',       Icon: StarIcon       },
    ] : []),
    ...(isSuperAdmin ? [{ to: '/retraits', label: 'Retraits MoMo', Icon: WithdrawIcon }] : []),
  ];

  const configSubs = [
    { to: '/configuration/profil', label: 'Mon profil', Icon: UserIcon },
    ...(isAdmin ? [
      { to: '/configuration/commerciaux',    label: 'Commerciaux',    Icon: UsersIcon    },
      { to: '/configuration/proprietaires',  label: 'Propriétaires',  Icon: BuildingIcon },
      { to: '/configuration/prospects',      label: 'Prospects',      Icon: UsersIcon    },
      { to: '/configuration/locataires',     label: 'Locataires',     Icon: KeyIcon      },
    ] : []),
    ...(isSuperAdmin ? [{ to: '/configuration/administrateurs', label: 'Administrateurs', Icon: ShieldIcon }] : []),
  ];

  return (
    <aside className={classes}>
      <nav className="immo-nav">
        {navItems.map(({ to, label, Icon }) => {
          const isSupervision = to === '/supervision';
          const badge = isSupervision && unreadCount > 0 ? unreadCount : 0;
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
              <span className="immo-nav-label">
                {label}
                {badge > 0 && !minimized && (
                  <span style={{
                    marginLeft: 6, background: '#DC2626', color: '#fff',
                    borderRadius: 20, padding: '1px 6px', fontSize: 10, fontWeight: 800,
                  }}>{badge}</span>
                )}
              </span>
            </NavLink>
          );
        })}

        {/* Configuration collapsible */}
        <div className="config-group">
          <button
            className={`immo-nav-item config-toggle${isConfigActive ? ' active' : ''}`}
            onClick={() => !minimized && setConfigOpen(o => !o)}
            title={minimized ? 'Configuration' : undefined}
          >
            <SettingsIcon />
            <span className="immo-nav-label">Configuration</span>
            <span className={`config-chevron${configOpen ? ' open' : ''}`}>
              <ChevronDownIcon />
            </span>
          </button>

          {configOpen && !minimized && (
            <div className="config-submenu">
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
      </nav>
    </aside>
  );
}
