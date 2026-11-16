import type { ProprietesRendu, TonAction } from '../shared/dialogues/useConfirm';

const STYLE_TON: Record<TonAction, React.CSSProperties> = {
  danger: { background: 'var(--c-red-solid)', boxShadow: '0 2px 8px rgba(220,38,38,0.25)' },
  primaire: {},
  neutre: {},
};

/**
 * Boîte de dialogue de confirmation de l'admin (rendu de ConfirmProvider) :
 * Échap ou clic à côté = Annuler ; le bouton principal prend la couleur de la gravité.
 */
export default function ConfirmDialog({ titre, message, actions, repondre, idTitre, idMessage, refDialogue }: ProprietesRendu) {
  const principale = actions[actions.length - 1];
  return (
    <div className="immo-modal-backdrop" style={{ zIndex: 100000 }} onClick={e => e.target === e.currentTarget && repondre(null)}>
      <div
        ref={refDialogue}
        className="immo-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        aria-describedby={message ? idMessage : undefined}
      >
        <h2 id={idTitre} className="immo-modal-title">{titre}</h2>
        {message && <div id={idMessage} className="immo-modal-sub" style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{message}</div>}
        <div className="immo-modal-actions" style={actions.length > 2 ? { flexWrap: 'wrap' } : undefined}>
          {actions.map(a => {
            const ton = a.ton ?? 'neutre';
            return (
              <button
                key={String(a.valeur)}
                type="button"
                className={ton === 'neutre' ? 'btn-cancel' : 'btn-submit'}
                style={STYLE_TON[ton]}
                data-autofocus={a === principale && ton !== 'danger' ? '' : undefined}
                onClick={() => repondre(a.valeur)}
              >
                {a.libelle}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
