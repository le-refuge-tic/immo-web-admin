import { useState } from 'react';
import { remunerationApi, type Conclusion } from '../../api/remuneration';
import { apiMessage } from '../../utils/apiMessage';
import { formatFcfa } from '../commercial/historiquePortefeuille';

type Props = {
  bien: any;
  onDeclaree: () => void;
  notifier: (msg: string, type?: 'success' | 'error' | 'info') => void;
};

/** Taux usuels de la commission Refuge, pour préremplir la saisie (modifiable). */
const commissionSuggeree = (nature: 'location' | 'vente', prix: number) =>
  Math.round(nature === 'location' ? prix * 0.5 : prix * 0.03);

/**
 * Prime de résultat : l'admin déclare le bien loué ou vendu avec la commission encaissée ;
 * 10 % sont crédités au commercial qui l'a publié (50/50 en binôme).
 */
export default function CarteConclusion({ bien, onDeclaree, notifier }: Props) {
  const prix = Number(bien.prix ?? 0);
  const [ouvert, setOuvert] = useState(false);
  const [nature, setNature] = useState<'location' | 'vente'>(bien.transaction === 'vente' ? 'vente' : 'location');
  const [commission, setCommission] = useState(String(commissionSuggeree(nature, prix)));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [envoi, setEnvoi] = useState(false);
  const conclusions: Conclusion[] = bien.amenites?.conclusions ?? [];
  const auteurCommercial = bien.user?.role_principal === 'commercial';
  const montant = Number(commission.replace(/\s/g, '')) || 0;

  const changerNature = (n: 'location' | 'vente') => {
    setNature(n);
    setCommission(String(commissionSuggeree(n, prix)));
  };

  async function declarer() {
    if (montant <= 0) { notifier('Indiquez la commission encaissée.', 'error'); return; }
    setEnvoi(true);
    try {
      const r = await remunerationApi.declarerConclusion(bien.id, { nature, commission: montant, date });
      notifier(r.credite
        ? `Conclusion enregistrée : ${formatFcfa(r.prime_resultat)} crédités au commercial.`
        : 'Conclusion enregistrée (bien publié hors commercial : aucune prime).', 'success');
      setOuvert(false);
      onDeclaree();
    } catch (e) {
      notifier(apiMessage(e) ?? 'Impossible d’enregistrer la conclusion.', 'error');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="detail-card">
      <div className="detail-section-title">Location / vente conclue</div>
      {conclusions.length > 0 && (
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12, lineHeight: 1.7, color: 'var(--c-text)' }}>
          {conclusions.map(c => (
            <li key={c.declaree_le}>
              {c.nature === 'vente' ? 'Vendu' : 'Loué'} le {new Date(c.date).toLocaleDateString('fr-FR')} · commission {formatFcfa(c.commission)}
              {c.prime_resultat > 0 && ` · prime de résultat ${formatFcfa(c.prime_resultat)}`}
            </li>
          ))}
        </ul>
      )}
      {!ouvert ? (
        <button type="button" className="detail-btn detail-btn--approve" onClick={() => setOuvert(true)}>
          Déclarer le bien loué ou vendu
        </button>
      ) : (
        <div className="detail-action-form">
          <div className="detail-form-row" role="group" aria-label="Nature de la conclusion">
            {(['location', 'vente'] as const).map(n => (
              <button key={n} type="button" aria-pressed={nature === n} onClick={() => changerNature(n)}
                className={`detail-btn ${nature === n ? 'detail-btn--approve' : 'detail-btn--cancel'}`}>
                {n === 'location' ? 'Loué' : 'Vendu'}
              </button>
            ))}
          </div>
          <label className="detail-form-label" htmlFor="conclusion-commission">Commission encaissée par Refuge (FCFA)</label>
          <input id="conclusion-commission" className="immo-form-input" inputMode="numeric" value={commission}
            onChange={e => setCommission(e.target.value.replace(/[^\d\s]/g, ''))} />
          <span style={{ fontSize: 11, color: 'var(--c-muted)' }}>
            Prérempli : {nature === 'location' ? '50 % du loyer' : '3 % du prix de vente'}. Saisissez le montant réellement encaissé.
          </span>
          <label className="detail-form-label" htmlFor="conclusion-date">Date</label>
          <input id="conclusion-date" className="immo-form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--c-text)' }}>
            {auteurCommercial
              ? <>Prime de résultat : <strong>{formatFcfa(Math.round(montant * 0.1))}</strong> (10 %) créditée au commercial, partagée 50/50 s’il est en binôme.</>
              : 'Ce bien n’a pas été publié par un commercial : aucune prime ne sera versée.'}
          </p>
          <div className="detail-form-row">
            <button type="button" className="detail-btn detail-btn--cancel" onClick={() => setOuvert(false)} disabled={envoi}>Annuler</button>
            <button type="button" className="detail-btn detail-btn--approve" onClick={declarer} disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
