export default function ProfilInfoCard({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="profil-info-card">
      <div className="profil-info-label">{label}</div>
      <div className={`profil-info-value${muted ? ' muted' : ''}`}>{value}</div>
    </div>
  );
}
