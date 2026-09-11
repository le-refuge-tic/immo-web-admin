import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'super_admin'];
const SUPER_ADMIN_ROLES = ['super_admin'];

// Un commercial n'a pas accès aux pages admin (ni à /annonces) : on le renvoie
// vers son tableau de bord. Un admin non super-admin reste redirigé vers /annonces.
function fallbackFor(role?: string) {
  return role === 'commercial' ? '/commercial-dashboard' : '/annonces';
}

export function AdminRoute({ children }: { children: any }) {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role;
  if (!user || !ADMIN_ROLES.includes(role)) {
    return <Navigate to={fallbackFor(role)} replace />;
  }
  return <>{children}</>;
}

export function SuperAdminRoute({ children }: { children: any }) {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role;
  if (!user || !SUPER_ADMIN_ROLES.includes(role)) {
    return <Navigate to={fallbackFor(role)} replace />;
  }
  return <>{children}</>;
}
