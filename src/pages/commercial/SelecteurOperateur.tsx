import { OPERATEURS, type OperateurRetrait } from '../../utils/retraitCommercial';

/**
 * Choix de l'opérateur Mobile Money (MTN ou Moov) du numéro de retrait, à faire à chaque demande.
 * Simple choix de formulaire : aucun code SMS, aucune suspension.
 */
export default function SelecteurOperateur({ valeur, onChange, disabled }: {
  valeur: OperateurRetrait | null;
  onChange: (operateur: OperateurRetrait) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Opérateur Mobile Money" style={{ marginBottom: 12 }}>
      <div className="immo-form-label" style={{ marginBottom: 6 }}>Opérateur de ce numéro *</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {OPERATEURS.map(o => {
          const choisi = valeur === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={choisi} disabled={disabled}
              onClick={() => onChange(o.value)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                border: `1.5px solid ${choisi ? 'var(--c-blue)' : 'var(--c-border)'}`,
                background: choisi ? 'var(--c-blue)' : 'var(--c-card)', color: choisi ? 'white' : 'var(--c-text)',
              }}>
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
