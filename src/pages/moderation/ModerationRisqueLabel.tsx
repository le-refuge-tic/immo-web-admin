export default function ModerationRisqueLabel({ b }: { b: any }) {
  const hasPhotos = b.photos && b.photos.length > 0;
  const hasDesc   = !!b.description;
  if (!hasPhotos && !hasDesc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="risk-label critique">CRITIQUE</span>
        <div className="risk-bar critique" />
      </div>
    );
  }
  if (!hasPhotos || !hasDesc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="risk-label moyen">MOYEN</span>
        <div className="risk-bar moyen" />
      </div>
    );
  }
  return (
    <>
      <div className="risk-dot" style={{ background: 'var(--c-green)' }} />
      <span className="risk-label minimal">MINIMAL</span>
    </>
  );
}
