import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

export const MESSAGE_ACCES_SUPER_ADMIN = 'Accès réservé au super administrateur';

/** Message affiché à la place d'une page réservée (rôle insuffisant ou réponse 403). */
export function AccesReserve() {
  return (
    <div className="immo-page">
      <div
        role="alert"
        style={{
          background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8,
          padding: '14px 18px', fontSize: 14, color: 'var(--s-red)', fontWeight: 600,
        }}
      >
        {MESSAGE_ACCES_SUPER_ADMIN}
      </div>
    </div>
  );
}

/**
 * Page réservée au super administrateur : tout autre rôle voit le message
 * d'accès réservé au lieu d'être redirigé (accès direct par l'URL).
 */
export default function AccesSuperAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role_principal ?? user?.role;
  if (role !== 'super_admin') return <AccesReserve />;
  return <>{children}</>;
}
