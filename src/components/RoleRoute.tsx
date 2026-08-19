import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'super_admin'];
const SUPER_ADMIN_ROLES = ['super_admin'];

export function AdminRoute({ children }: { children: any }) {
  const { user } = useAuth();
  if (!user || !ADMIN_ROLES.includes(user.role_principal ?? user.role)) {
    return <Navigate to="/annonces" replace />;
  }
  return <>{children}</>;
}

export function SuperAdminRoute({ children }: { children: any }) {
  const { user } = useAuth();
  if (!user || !SUPER_ADMIN_ROLES.includes(user.role_principal ?? user.role)) {
    return <Navigate to="/annonces" replace />;
  }
  return <>{children}</>;
}
