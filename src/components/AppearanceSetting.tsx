import { useId } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { ThemePreference } from '../context/ThemeContext';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light',  label: 'Clair' },
  { value: 'dark',   label: 'Sombre' },
  { value: 'system', label: 'Système' },
];

/** Seul réglage de thème de l'interface admin (Mon profil → Apparence). */
export default function AppearanceSetting() {
  const { preference, setPreference } = useTheme();
  const labelId = useId();
  return (
    <div className="immo-card appearance-card">
      <div className="appearance-head">
        <div className="appearance-icon" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </div>
        <div>
          <div id={labelId} className="appearance-title">Apparence</div>
          <div className="appearance-sub">
            {preference === 'system' ? "Suit le réglage de votre ordinateur ou téléphone." : 'Choisissez le thème de l\'interface.'}
          </div>
        </div>
      </div>
      <div role="radiogroup" aria-labelledby={labelId} className="appearance-seg">
        {OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={preference === o.value}
            className={preference === o.value ? 'is-active' : ''}
            onClick={() => setPreference(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
