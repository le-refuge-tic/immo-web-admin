const STATUT_LABELS: any = {
  en_attente: 'En attente',
  en_retard:  'En retard',
  paye:       'Payé',
  impaye:     'Impayé',
};

const STATUT_COLORS: any = {
  en_attente: '#2563EB',
  en_retard:  '#DC2626',
  paye:       '#16A34A',
  impaye:     '#9333EA',
};

export default function LoyersStatutBadge({ statut }: { statut: any }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: STATUT_COLORS[statut] + '18',
      color: STATUT_COLORS[statut],
      textTransform: 'uppercase', letterSpacing: '0.5px',
    }}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
