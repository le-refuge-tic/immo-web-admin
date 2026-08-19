import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GridIcon, HomeIcon, UsersIcon, SettingsIcon, ShieldIcon,
  ChevronDownIcon, UserIcon, BuildingIcon, KeyIcon, FileTextIcon, TrendingUpIcon, StarIcon,
  MessageIcon, WithdrawIcon, ListingsIcon, VisitIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';

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

  const classes = [
    'immo-sidebar',
    minimized ? 'immo-sidebar--min' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const navItems = [
    ...(isAdmin     ? [{ to: '/dashboard',    label: 'Tableau de bord',  Icon: GridIcon       }] : []),
    { to: '/annonces',     label: 'Annonces',          Icon: HomeIcon       },
    ...(isCommercial ? [
      { to: '/mes-annonces', label: 'Mes annonces',    Icon: ListingsIcon   },
      { to: '/mes-visites',  label: 'Mes visites',     Icon: VisitIcon      },
    ] : []),
    { to: '/messages',     label: 'Messages',           Icon: MessageIcon    },
    ...(isAdmin ? [
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
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={minimized ? label : undefined}
            className={({ isActive }) => `immo-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span className="immo-nav-label">{label}</span>
          </NavLink>
        ))}

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
