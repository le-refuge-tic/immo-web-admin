import { useState } from 'react';

export default function ContrePropositionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (date: string) => void }) {
  const [date, setDate] = useState('');
  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 380 }}>
        <div className="immo-modal-title">Contre-proposer une date</div>
        <div className="immo-form-field" style={{ marginTop: 16 }}>
          <label className="immo-form-label">Nouvelle date de visite *</label>
          <input
            className="immo-form-input"
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>
        <div className="immo-modal-actions">
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
          <button className="btn-submit" onClick={() => date && onConfirm(date)} disabled={!date}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
