import { useState } from 'react';
import type { RemboursementAdmin } from '../../api/remboursementsAdmin';

type Mode = 'repos' | 'verse' | 'rejet';

const btn = (couleur: string, fond: string, inactif: boolean): React.CSSProperties => ({
  padding: '6px 14px', borderRadius: 8, border: 'none', background: fond, color: couleur,
  fontWeight: 600, fontSize: 13, cursor: inactif ? 'not-allowed' : 'pointer', opacity: inactif ? 0.6 : 1,
});
const champ: React.CSSProperties = { padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--c-border)', fontSize: 13 };
const secondaire: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', fontSize: 13, cursor: 'pointer',
};

const fcfa = (n: number | string) => Number(n).toLocaleString('fr-FR') + ' FCFA';

/**
 * « Versé » (après l'envoi Mobile Money, référence obligatoire) ou « Rejeter »
 * (motif obligatoire). Chaque action se confirme dans un petit formulaire.
 */
export function ActionsRemboursement({ r, occupe, onVerse, onRejete }: {
  r: RemboursementAdmin;
  occupe: boolean;
  onVerse: (reference: string) => Promise<boolean>;
  onRejete: (motif: string) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<Mode>('repos');
  const [texte, setTexte] = useState('');

  if (r.statut !== 'a_rembourser') return <span style={{ color: 'var(--c-muted)', fontSize: 12 }}>—</span>;

  const fermer = () => { setMode('repos'); setTexte(''); };
  const valider = async () => {
    const ok = mode === 'verse' ? await onVerse(texte.trim()) : await onRejete(texte.trim());
    if (ok) fermer();
  };

  if (mode === 'repos') {
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setMode('verse')} disabled={occupe} style={btn('#fff', '#10b981', occupe)}>Versé</button>
        <button onClick={() => setMode('rejet')} disabled={occupe} style={btn('var(--s-red)', 'var(--t-red-bg)', occupe)}>Rejeter</button>
      </div>
    );
  }

  const verse = mode === 'verse';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8, border: '1px solid var(--c-border)', borderRadius: 8, minWidth: 220 }}>
      <span style={{ fontSize: 12, color: 'var(--c-text)' }}>
        {verse
          ? <>Envoyez d&apos;abord <strong>{fcfa(r.montant)}</strong> au {r.telephone ?? 'client'}, puis saisissez la référence du transfert.</>
          : <>Le client ne sera pas remboursé. Indiquez pourquoi.</>}
      </span>
      <input
        autoFocus value={texte} onChange={e => setTexte(e.target.value)} maxLength={verse ? 200 : 500}
        placeholder={verse ? 'Référence Mobile Money' : 'Motif du rejet'}
        aria-label={verse ? 'Référence du versement Mobile Money' : 'Motif du rejet'} style={champ}
      />
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={valider} disabled={occupe || !texte.trim()}
          style={{ ...(verse ? btn('#fff', '#10b981', occupe || !texte.trim()) : btn('#fff', 'var(--s-red)', occupe || !texte.trim())), flex: 1 }}>
          {occupe ? '…' : verse ? 'Confirmer le versement' : 'Confirmer le rejet'}
        </button>
        <button onClick={fermer} disabled={occupe} style={secondaire}>Annuler</button>
      </div>
    </div>
  );
}
