import { useState } from 'react';
import { postBien } from '../../api/postBien';

const TYPES = [
  { value: 'maison',        label: 'Maison / Villa' },
  { value: 'appart_vide',   label: 'Appartement vide' },
  { value: 'appart_meuble', label: 'Appartement meublé' },
  { value: 'guesthouse',    label: 'Guesthouse' },
  { value: 'terrain',       label: 'Terrain' },
];

const SOUS_TYPES: Record<string, { value: string; label: string }[]> = {
  maison: [
    { value: 'villa',               label: 'Villa' },
    { value: 'maison_individuelle', label: 'Maison individuelle' },
    { value: 'villa_maison',        label: 'Villa / Maison' },
  ],
  appart_vide: [
    { value: 'appartement',     label: 'Appartement' },
    { value: 'chambre_salon',   label: 'Chambre salon' },
    { value: 'entree_coucher',  label: 'Entrée coucher' },
  ],
  appart_meuble: [
    { value: 'appartement', label: 'Appartement meublé' },
    { value: 'guesthouse',  label: 'Guesthouse' },
  ],
};

const EMPTY = {
  type: '', transaction: 'location', prix: '',
  description: '',
  adresse: '', ville: '', quartier: '',
  latitude: '', longitude: '',
  sous_type: '',
};

export default function PublierBienModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (b: any) => void;
}) {
  const [form, setForm]     = useState({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.type) { setError('Veuillez choisir un type de bien.'); return; }
    setError('');
    setLoading(true);
    try {
      const dto: any = {
        type: form.type,
        transaction: form.transaction,
        prix: Number(form.prix),
        description: form.description || undefined,
        localisation: {
          adresse:   form.adresse,
          ville:     form.ville,
          quartier:  form.quartier || undefined,
          latitude:  Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
        },
      };
      if (form.sous_type) dto.amenites = { sous_type: form.sous_type };
      const res = await postBien.create(dto);
      onCreated(res);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const sousList = SOUS_TYPES[form.type] ?? [];

  return (
    <div className="immo-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="immo-modal" style={{ maxWidth: 560 }}>
        <div className="immo-modal-title">Publier un bien</div>
        <div className="immo-modal-sub">
          Votre annonce sera soumise à modération avant publication.
        </div>

        {error && (
          <div style={{
            background: 'var(--c-red-bg)', color: 'var(--c-red)',
            border: '1px solid #FECACA', borderRadius: 8,
            padding: '9px 13px', fontSize: 12, fontWeight: 500, marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Type + sous-type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Type de bien *</label>
              <select
                className="immo-form-input"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value, sous_type: '' }))}
                required
              >
                <option value="">— Choisir —</option>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Sous-type</label>
              <select
                className="immo-form-input"
                value={form.sous_type}
                onChange={set('sous_type')}
                disabled={!sousList.length}
              >
                <option value="">— Optionnel —</option>
                {sousList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Transaction + prix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Transaction *</label>
              <select className="immo-form-input" value={form.transaction} onChange={set('transaction')} required>
                <option value="location">Location</option>
                <option value="vente">Vente</option>
              </select>
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Prix (FCFA) *</label>
              <input className="immo-form-input" type="number" min="0" value={form.prix} onChange={set('prix')} required placeholder="ex. 80000" />
            </div>
          </div>

          {/* Localisation */}
          <div className="immo-form-field">
            <label className="immo-form-label">Adresse *</label>
            <input className="immo-form-input" value={form.adresse} onChange={set('adresse')} required placeholder="Rue / Boulevard..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Ville *</label>
              <input className="immo-form-input" value={form.ville} onChange={set('ville')} required placeholder="Cotonou" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Quartier</label>
              <input className="immo-form-input" value={form.quartier} onChange={set('quartier')} placeholder="Cadjehoun" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="immo-form-field">
              <label className="immo-form-label">Latitude</label>
              <input className="immo-form-input" type="number" step="any" value={form.latitude} onChange={set('latitude')} placeholder="6.3654" />
            </div>
            <div className="immo-form-field">
              <label className="immo-form-label">Longitude</label>
              <input className="immo-form-input" type="number" step="any" value={form.longitude} onChange={set('longitude')} placeholder="2.4183" />
            </div>
          </div>

          {/* Description */}
          <div className="immo-form-field">
            <label className="immo-form-label">Description</label>
            <textarea
              className="immo-form-input"
              rows={3}
              value={form.description}
              onChange={set('description')}
              placeholder="Décrivez le bien..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="immo-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Publication…
                </>
              ) : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
