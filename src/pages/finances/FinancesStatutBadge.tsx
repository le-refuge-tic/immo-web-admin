const STATUT_COLORS: any = {
  en_attente: '#2563EB',
  confirme:   '#16A34A',
  echoue:     '#DC2626',
  rembourse:  '#9333EA',
};

const STATUT_LABELS: any = {
  en_attente: 'En attente',
  confirme:   'Confirmé',
  echoue:     'Échoué',
  rembourse:  'Remboursé',
};

export default function FinancesStatutBadge({ statut }: { statut: any }) {
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
