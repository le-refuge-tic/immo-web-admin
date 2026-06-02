import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GridIcon, HomeIcon, ShieldIcon, UsersIcon, SettingsIcon,
  ChevronDownIcon, UserIcon, BuildingIcon, KeyIcon, FileTextIcon, TrendingUpIcon, StarIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';

const TOP_NAV = [
  { to: '/dashboard',    label: 'Tableau de bord', Icon: GridIcon        },
  { to: '/annonces',     label: 'Annonces Immo',   Icon: HomeIcon        },
  { to: '/moderation',   label: 'Modération',      Icon: ShieldIcon      },
  { to: '/utilisateurs', label: 'Utilisateurs',    Icon: UsersIcon       },
  { to: '/loyers',       label: 'Loyers',          Icon: FileTextIcon    },
  { to: '/finances',     label: 'Finances',        Icon: TrendingUpIcon  },
  { to: '/feedbacks',    label: 'Feedbacks',       Icon: StarIcon        },
];

const CONFIG_SUBS_BASE = [
  { to: '/configuration/profil',        label: 'Mon profil',    Icon: UserIcon     },
  { to: '/configuration/proprietaires', label: 'Propriétaires', Icon: BuildingIcon },
  { to: '/configuration/prospects',     label: 'Prospects',     Icon: UsersIcon    },
  { to: '/configuration/locataires',    label: 'Locataires',    Icon: KeyIcon      },
];

const CONFIG_SUB_ADMINS = {
  to: '/configuration/administrateurs',
  label: 'Administrateurs',
  Icon: ShieldIcon,
};

export default function Sidebar({
  minimized,
  mobileOpen,
}: {
  minimized: boolean;
  mobileOpen: boolean;
}) {
  const { user } = useAuth();
  const location = useLocation();

  const isConfigActive = location.pathname.startsWith('/configuration');
  const [configOpen, setConfigOpen] = useState(isConfigActive);

  const classes = [
    'immo-sidebar',
    minimized ? 'immo-sidebar--min' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes}>
      <nav className="immo-nav">
        {/* Top nav items */}
        {TOP_NAV.map(({ to, label, Icon }) => (
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
              {[
                ...CONFIG_SUBS_BASE,
                ...(user?.role === 'super_admin' ? [CONFIG_SUB_ADMINS] : []),
              ].map(({ to, label, Icon }) => (
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
