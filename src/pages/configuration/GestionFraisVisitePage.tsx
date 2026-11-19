import { useEffect, useState } from 'react';
import { configurationFraisVisite } from '../../api/configurationFraisVisite';
import { apiMessage } from '../../utils/apiMessage';
import { ErreurChamp, NumberInput } from '../../shared/saisie/champs';
import { idErreur, useValidation } from '../../shared/saisie/validation';
import { schemaFraisVisite } from '../../validation/schemas';

export default function GestionFraisVisitePage() {
  const [montant, setMontant] = useState('500');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const v = useValidation('frais-visite', schemaFraisVisite, { montant });
  const saving = v.envoiEnCours;

  useEffect(() => {
    configurationFraisVisite.get()
      .then(data => setMontant(String(data.montant)))
      .catch(err => setError(apiMessage(err) ?? 'Impossible de charger le tarif'))
      .finally(() => setLoading(false));
  }, []);

  const enregistrer = () => {
    setError('');
    setMessage('');
    void v.soumettre(async d => {
      try {
        const data = await configurationFraisVisite.update(d.montant);
        setMontant(String(data.montant));
        setMessage(`Tarif promotionnel enregistré : ${data.montant.toLocaleString('fr-FR')} FCFA`);
      } catch (err) {
        setError(apiMessage(err) ?? "Impossible d'enregistrer le tarif");
      }
    });
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Frais de visite</h1>
          <p>Tarif promotionnel appliqué aux biens sans frais personnalisés</p>
        </div>
      </div>
      <div className="immo-page">
        <div className="immo-card" style={{ maxWidth: 620, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', color: '#ea580c', display: 'grid', placeItems: 'center', fontWeight: 900 }}>%</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--c-text)' }}>Tarif promotionnel</div>
              <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>Réservé au super administrateur</div>
            </div>
          </div>

          <label htmlFor="frais-visite-montant" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--c-text)', marginBottom: 8 }}>
            Montant par visite (FCFA)
          </label>
          <NumberInput milliers
            min={0}
            max={100000}
            value={montant}
            disabled={loading || saving}
            onChange={e => setMontant(e.target.value)}
            style={{ width: '100%', height: 44, border: '1px solid var(--c-border)', borderRadius: 10, padding: '0 12px', background: 'var(--c-bg)', color: 'var(--c-text)' }}
            {...v.propsChamp('montant')}
          />
          <ErreurChamp id={idErreur('frais-visite', 'montant')} message={v.erreurs.montant} />
          {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</div>}
          {message && <div style={{ marginTop: 12, color: '#16a34a', fontSize: 13 }}>{message}</div>}
          <button
            type="button"
            onClick={enregistrer}
            disabled={loading || saving}
            style={{ marginTop: 18, height: 42, border: 0, borderRadius: 10, background: '#2563eb', color: 'white', padding: '0 18px', fontWeight: 800, cursor: 'pointer' }}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le tarif'}
          </button>
        </div>
      </div>
    </>
  );
}
