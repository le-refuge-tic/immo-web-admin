import { useState } from 'react';
import { CheckIcon, XIcon, HomeIcon, ChevronLeftIcon } from '../../components/Icons';
import ModerationRisqueLabel from './ModerationRisqueLabel';
import { moderationChecks, TYPE_LABELS, formatPrix, auteurNom } from './moderationChecks';

type Props = {
  bien: any;
  onApprove: () => void;
  onReject: () => void;
  /** Téléphone : bouton retour vers la file. */
  onBack?: () => void;
};

/** Panneau de détail d'une annonce en attente : photos, texte, contrôles, actions. */
export default function ModerationDetail({ bien: b, onApprove, onReject, onBack }: Props) {
  const photos: { url: string }[] = Array.isArray(b.photos) ? b.photos : [];
  const [photoIdx, setPhotoIdx] = useState(0);
  const checks = moderationChecks(b);
  const lieu = [b.localisation?.quartier, b.localisation?.ville].filter(Boolean).join(', ') || 'Localisation non renseignée';

  return (
    <section className="immo-card mod-detail" aria-label={`Annonce ${TYPE_LABELS[b.type] ?? b.type}, ${lieu}`}>
      {onBack && (
        <button type="button" className="mod-back" onClick={onBack}>
          <ChevronLeftIcon /> File d’attente
        </button>
      )}

      <div className="mod-gallery">
        {photos.length > 0 ? (
          <>
            <img src={photos[photoIdx]?.url} alt={`Photo ${photoIdx + 1} sur ${photos.length} de l’annonce`} />
            {photos.length > 1 && (
              <div className="mod-thumbs" role="group" aria-label="Choisir une photo">
                {photos.slice(0, 8).map((p, i) => (
                  <button key={p.url + i} type="button" aria-pressed={i === photoIdx} onClick={() => setPhotoIdx(i)}>
                    <img src={p.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mod-gallery-empty"><HomeIcon size={28} /><span>Aucune photo fournie</span></div>
        )}
      </div>

      <div className="mod-detail-head">
        <div style={{ minWidth: 0 }}>
          <div className="mod-type-tag">{TYPE_LABELS[b.type] ?? b.type} · n° {b.id}</div>
          <h2 className="mod-detail-title">{lieu}</h2>
          <div className="mod-sub">Publié par {auteurNom(b)}{b.created_at ? ` le ${new Date(b.created_at).toLocaleDateString('fr-FR')}` : ''}</div>
        </div>
        <div className="mod-detail-price">{formatPrix(b)}</div>
      </div>

      <p className="mod-detail-desc">{b.description?.trim() || 'Aucune description.'}</p>

      <div className="mod-checks-head">
        <span>Contrôles automatiques</span>
        <span className="mod-risk-inline"><ModerationRisqueLabel b={b} /></span>
      </div>
      <ul className="mod-checks">
        {checks.map(c => (
          <li key={c.label} className={c.ok ? 'ok' : 'ko'}>
            <span aria-hidden="true">{c.ok ? <CheckIcon size={12} /> : <XIcon size={12} />}</span>
            <span><span className="sr-only">{c.ok ? 'Conforme : ' : 'À vérifier : '}</span>{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="mod-detail-actions">
        <button type="button" className="btn-cancel mod-btn-reject" onClick={onReject}>
          Rejeter… <kbd>R</kbd>
        </button>
        <button type="button" className="btn-submit mod-btn-approve" onClick={onApprove}>
          Approuver… <kbd>A</kbd>
        </button>
      </div>
    </section>
  );
}
