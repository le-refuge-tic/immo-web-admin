import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  GridIcon, HomeIcon, UsersIcon, SettingsIcon, ShieldIcon, AlertIcon,
  ChevronDownIcon, UserIcon, BuildingIcon, KeyIcon, FileTextIcon, TrendingUpIcon, StarIcon,
  MessageIcon, WithdrawIcon, ListingsIcon, VisitIcon, ClientsIcon, FlagIcon,
} from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useSidebarBadges } from '../hooks/useSidebarBadges';

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

  const badges = useSidebarBadges({ isAdmin, isCommercial, userId: user?.id });

  const classes = [
    'immo-sidebar',
    minimized ? 'immo-sidebar--min' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  type IconType = React.ComponentType<{ size?: number }>;
  type NavItem = { to: string; label: string; Icon: IconType };
  type NavGroup = { id: string; label: string; Icon: IconType; items: NavItem[] };

  // Menu regroupé par domaine (règle des 7 ± 2 entrées visibles) : seul le
  // groupe de la page courante est ouvert, les badges remontent sur l'en-tête
  // d'un groupe fermé. Les commerciaux gardent une liste courte, non groupée.
  const groups: NavGroup[] = isAdmin ? [
    { id: 'pilotage', label: 'Pilotage', Icon: GridIcon, items: [
      { to: '/dashboard',   label: 'Tableau de bord',    Icon: GridIcon },
      { to: '/supervision', label: 'Suivi des échanges', Icon: ShieldIcon },
    ] },
    { id: 'annonces', label: 'Annonces', Icon: HomeIcon, items: [
      { to: '/annonces',   label: 'Toutes les annonces', Icon: HomeIcon },
      { to: '/moderation', label: 'Modération',          Icon: AlertIcon },
      { to: '/quartiers',  label: 'Quartiers',           Icon: BuildingIcon },
    ] },
    { id: 'relation', label: 'Relation client', Icon: MessageIcon, items: [
      { to: '/messages',     label: 'Messages',     Icon: MessageIcon },
      { to: '/reclamations', label: 'Réclamations', Icon: FlagIcon },
      { to: '/feedbacks',    label: 'Feedbacks',    Icon: StarIcon },
    ] },
    { id: 'utilisateurs', label: 'Utilisateurs', Icon: UsersIcon, items: [
      { to: '/utilisateurs', label: 'Tous les utilisateurs', Icon: UsersIcon },
      { to: '/liaisons',     label: 'Liaisons gestion',      Icon: KeyIcon },
    ] },
    { id: 'finances', label: 'Finances', Icon: TrendingUpIcon, items: [
      { to: '/finances', label: 'Vue d\'ensemble', Icon: TrendingUpIcon },
      { to: '/loyers',   label: 'Loyers',          Icon: FileTextIcon },
      { to: '/retraits', label: 'Retraits MoMo',   Icon: WithdrawIcon },
    ] },
  ] : [];

  const flatItems: NavItem[] = isAdmin ? [] : [
    ...(isCommercial ? [
      { to: '/commercial-dashboard', label: 'Tableau de bord', Icon: GridIcon     },
      { to: '/mes-annonces',         label: 'Mes annonces',    Icon: ListingsIcon },
      { to: '/mes-visites',          label: 'Mes visites',     Icon: VisitIcon    },
      { to: '/mes-clients',          label: 'Mes clients',     Icon: ClientsIcon  },
      { to: '/mon-equipe',           label: 'Mon équipe',      Icon: UsersIcon    },
    ] : []),
    { to: '/messages', label: 'Messages', Icon: MessageIcon },
  ];

  const configSubs: NavItem[] = [
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
  const allGroups: NavGroup[] = [...groups, { id: 'configuration', label: 'Configuration', Icon: SettingsIcon, items: configSubs }];

  const badgeFor = (to: string) => ({
    '/supervision':  badges.supervision,
    '/messages':     badges.messages,
    '/moderation':   badges.moderation,
    '/quartiers':    badges.quartiers,
    '/retraits':     badges.retraits,
    '/mes-annonces': badges.mesAnnonces,
  } as Record<string, number>)[to] ?? 0;

  const isPathActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');
  const activeGroupId = allGroups.find(g => g.items.some(i => isPathActive(i.to)))?.id;
  // Choix explicites de l'utilisateur ; sans choix, seul le groupe de la page courante est ouvert.
  // Les choix sont oubliés dès que la page courante change de groupe : le groupe
  // de la nouvelle page s'ouvre toujours, les autres reprennent leur état par défaut.
  const [overrides, setOverrides] = useState<{ forGroup?: string; map: Record<string, boolean> }>({ map: {} });
  const openGroups = overrides.forGroup === activeGroupId ? overrides.map : {};
  const isGroupOpen = (id: string) => openGroups[id] ?? id === activeGroupId;
  const toggleGroup = (id: string) =>
    setOverrides({ forGroup: activeGroupId, map: { ...openGroups, [id]: !isGroupOpen(id) } });

  const badgeEl = (n: number, inline = false) => n > 0 ? (
    <span className={`immo-nav-badge${inline ? ' immo-nav-badge--inline' : ''}`}>{n > 99 ? '99+' : n}</span>
  ) : null;

  const renderItem = ({ to, label, Icon }: NavItem) => {
    const badge = badgeFor(to);
    return (
      <NavLink
        key={to}
        to={to}
        title={minimized ? label : undefined}
        className={({ isActive }) => `immo-nav-item${isActive ? ' active' : ''}`}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <Icon />
          {badgeEl(badge)}
        </span>
        <span className="immo-nav-label">{label}</span>
      </NavLink>
    );
  };

  return (
    <aside id="immo-sidebar" className={classes} aria-label="Navigation principale">
      <nav className="immo-nav">
        {flatItems.map(renderItem)}

        {/* Mode réduit (icônes seules) : toutes les entrées à plat, sans en-têtes de groupe */}
        {minimized ? allGroups.map(g => (
          <div key={g.id} className="immo-nav-sep">{g.items.map(renderItem)}</div>
        )) : allGroups.map(g => {
          const open = isGroupOpen(g.id);
          const groupBadge = g.items.reduce((s, i) => s + badgeFor(i.to), 0);
          const hasActive = g.id === activeGroupId;
          const GIcon = g.Icon;
          return (
            <div key={g.id} className="config-group">
              <button
                className={`immo-nav-item config-toggle${hasActive ? ' active' : ''}`}
                onClick={() => toggleGroup(g.id)}
                aria-expanded={open}
                aria-controls={`nav-group-${g.id}`}
              >
                <GIcon />
                <span className="immo-nav-label">{g.label}</span>
                {!open && badgeEl(groupBadge, true)}
                <span className={`config-chevron${open ? ' open' : ''}`}>
                  <ChevronDownIcon />
                </span>
              </button>
              <div id={`nav-group-${g.id}`} className="config-submenu" hidden={!open}>
                {open && g.items.map(renderItem)}
              </div>
            </div>
          );
        })}

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
