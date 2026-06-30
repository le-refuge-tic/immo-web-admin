export default function GestionAdminRoleBadge({ role }: { role: string }) {
  const isSuperAdmin = role === 'super_admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.5px', textTransform: 'uppercase',
      background: isSuperAdmin ? '#FFF7ED' : '#EFF6FF',
      color: isSuperAdmin ? 'var(--c-orange)' : 'var(--c-blue)',
      border: `1px solid ${isSuperAdmin ? '#FED7AA' : '#BFDBFE'}`,
    }}>
      {isSuperAdmin ? '★ Super Admin' : 'Administrateur'}
    </span>
  );
}
