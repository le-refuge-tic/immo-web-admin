export default function ConfigRowItem({ label, desc, badge, badgeColor }: {
  label: string; desc: string; badge?: string; badgeColor?: string;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--c-border)',
    }}>
      {badge && (
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
          background: badgeColor ? `${badgeColor}20` : 'var(--c-bg)',
          color: badgeColor ?? 'var(--c-text)',
          minWidth: 80, textAlign: 'center', flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--c-text)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <span className="badge-actif">ACTIF</span>
    </div>
  );
}
