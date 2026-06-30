export default function FeedbackStars({ note }: { note: any }) {
  if (note === null || note === undefined)
    return <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>;
  return (
    <span style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(Math.round(note))}{'☆'.repeat(5 - Math.round(note))}
      <span style={{ fontSize: 11, color: 'var(--c-muted)', marginLeft: 4 }}>{note}/5</span>
    </span>
  );
}
