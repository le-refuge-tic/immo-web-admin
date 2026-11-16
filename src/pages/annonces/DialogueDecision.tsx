import { useEffect, useId, useState } from 'react';

const TEXTE_MIN = 5;

export type DecisionTexte = 'rejeter' | 'conditionnel' | 'revoquer';

const TEXTES: Record<DecisionTexte, { titre: string; aide: string; champ: string; placeholder: string; confirmer: string; couleur: string }> = {
  rejeter: {
    titre: 'Rejeter l’annonce',
    aide: 'Le motif est envoyé à l’auteur (et au propriétaire si l’annonce vient d’un commercial).',
    champ: 'Motif du refus',
    placeholder: 'Expliquer la raison du rejet…',
    confirmer: 'Rejeter',
    couleur: 'var(--c-red)',
  },
  conditionnel: {
    titre: 'Publier sous conditions',
    aide: 'L’annonce est publiée ; les conditions sont envoyées à l’auteur et affichées sur sa fiche.',
    champ: 'Conditions de publication',
    placeholder: 'Conditions imposées pour la publication…',
    confirmer: 'Publier sous conditions',
    couleur: 'var(--s-yellow)',
  },
  revoquer: {
    titre: 'Retirer la publication',
    aide: 'L’annonce n’est plus visible et revient dans la file de modération. Le motif est envoyé à l’auteur.',
    champ: 'Motif du retrait',
    placeholder: 'Ex. bien déjà loué, informations erronées…',
    confirmer: 'Retirer la publication',
    couleur: 'var(--c-red)',
  },
};

/**
 * Lot 7 — dialogue des décisions qui demandent un texte (rejet, conditions, retrait).
 * Le texte est obligatoire ; une erreur de l'API s'affiche sans fermer le dialogue.
 */
export default function DialogueDecision({ decision, bienId, enCours, erreur, onAnnuler, onConfirmer }: {
  decision: DecisionTexte;
  bienId: number;
  enCours: boolean;
  erreur: string;
  onAnnuler: () => void;
  onConfirmer: (texte: string) => void;
}) {
  const t = TEXTES[decision];
  const [texte, setTexte] = useState('');
  const id = useId();
  const valide = texte.trim().length >= TEXTE_MIN;

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enCours) onAnnuler(); };
    document.addEventListener('keydown', echap);
    return () => document.removeEventListener('keydown', echap);
  }, [enCours, onAnnuler]);

  return (
    <div className="immo-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`}
      onClick={e => e.target === e.currentTarget && !enCours && onAnnuler()}>
      <div className="immo-modal">
        <div id={`${id}-titre`} className="immo-modal-title">{t.titre} — bien n° {bienId}</div>
        <div className="immo-modal-sub">{t.aide}</div>
        {erreur && <p role="alert" style={{ color: 'var(--c-red)', fontSize: 13, margin: '0 0 12px' }}>{erreur}</p>}
        <form onSubmit={e => { e.preventDefault(); if (valide && !enCours) onConfirmer(texte.trim()); }}>
          <div className="immo-form-field">
            <label className="immo-form-label" htmlFor={`${id}-texte`}>{t.champ} *</label>
            <textarea id={`${id}-texte`} className="immo-form-input" rows={4} maxLength={1000} autoFocus
              placeholder={t.placeholder} value={texte} onChange={e => setTexte(e.target.value)} />
            {!valide && <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>{TEXTE_MIN} caractères au moins.</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn-cancel" disabled={enCours} onClick={onAnnuler}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={!valide || enCours} style={{ flex: 1, background: t.couleur }}>
              {enCours ? 'Enregistrement…' : t.confirmer}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
