export default function ConfigSection({ title, children }: { title: string; children: any }) {
  return (
    <div className="immo-card" style={{ padding: '20px 24px' }}>
      <div className="section-header" style={{ marginBottom: 16 }}>
        <span className="section-title">{title}</span>
      </div>
      {children}
    </div>
  );
}
