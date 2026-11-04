import { useState } from 'react';
import { remunerationApi, type LigneRegularisation } from '../../api/remuneration';
import { apiMessage } from '../../utils/apiMessage';
import { formatFcfa } from '../commercial/historiquePortefeuille';
import { useToast } from '../../context/ToastContext';

type Apercu = { lignes: LigneRegularisation[]; total: number; trop_percus: number };

/**
 * Super-admin : régularisation des primes de validation créditées avec l'ancienne grille.
 * Aperçu d'abord (aucun versement), puis versement des seuls compléments.
 */
export default function RegularisationPrimes() {
  const toast = useToast();
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [chargement, setChargement] = useState(false);
  const [confirmer, setConfirmer] = useState(false);

  async function calculer() {
    setChargement(true);
    try {
      setApercu(await remunerationApi.apercuRegularisation());
    } catch (e) {
      toast(apiMessage(e) ?? 'Calcul impossible.', 'error');
    } finally {
      setChargement(false);
    }
  }

  async function verser() {
    setChargement(true);
    try {
      const r = await remunerationApi.executerRegularisation();
      toast(`${r.versees} complément(s) versé(s), ${formatFcfa(r.total)} au total.`, 'success');
      setConfirmer(false);
      setApercu(await remunerationApi.apercuRegularisation());
    } catch (e) {
      toast(apiMessage(e) ?? 'Versement impossible.', 'error');
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="immo-card" aria-labelledby="titre-regul" style={{ marginTop: 18 }}>
      <div className="section-header">
        <span id="titre-regul" className="section-title">Régularisation des primes</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--c-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
        Recalcule chaque prime de validation avec la grille du 4 novembre 2026 et verse ce qui manque.
        Un trop-perçu reste acquis au commercial. Chaque complément apparaît dans son historique, avec le détail.
      </p>
      <button type="button" className="btn-cancel" onClick={calculer} disabled={chargement}>
        {chargement && !apercu ? 'Calcul…' : apercu ? 'Recalculer l’aperçu' : 'Voir l’aperçu'}
      </button>

      {apercu && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--c-text)', margin: '0 0 8px' }}>
            {apercu.lignes.length === 0
              ? 'Aucun complément à verser.'
              : <>{apercu.lignes.length} complément(s) pour <strong>{formatFcfa(apercu.total)}</strong>.</>}
            {apercu.trop_percus > 0 && ` Trop-perçu laissé aux commerciaux : ${formatFcfa(apercu.trop_percus)}.`}
          </p>
          {apercu.lignes.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--c-muted)' }}>
                    <th style={{ padding: '6px 8px' }}>Commercial</th>
                    <th style={{ padding: '6px 8px' }}>Bien</th>
                    <th style={{ padding: '6px 8px' }}>Catégorie</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Dû</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Reçu</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Complément</th>
                  </tr>
                </thead>
                <tbody>
                  {apercu.lignes.map(l => (
                    <tr key={l.bien_id} style={{ borderTop: '1px solid var(--c-border)', color: 'var(--c-text)' }}>
                      <td style={{ padding: '6px 8px' }}>{l.commercial}</td>
                      <td style={{ padding: '6px 8px' }}>#{l.bien_id}</td>
                      <td style={{ padding: '6px 8px' }}>{l.detail.categorie_libelle}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatFcfa(l.montant_du)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatFcfa(l.montant_credite)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>+{formatFcfa(l.complement)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {apercu.lignes.length > 0 && (
            !confirmer ? (
              <button type="button" className="btn-submit" style={{ marginTop: 12 }} onClick={() => setConfirmer(true)} disabled={chargement}>
                Verser les compléments
              </button>
            ) : (
              <div role="alert" style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--c-text)' }}>
                  Verser {formatFcfa(apercu.total)} dans les portefeuilles ? Les commerciaux pourront les retirer.
                </span>
                <button type="button" className="btn-cancel" onClick={() => setConfirmer(false)} disabled={chargement}>Annuler</button>
                <button type="button" className="btn-submit" onClick={verser} disabled={chargement}>
                  {chargement ? 'Versement…' : 'Confirmer le versement'}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
