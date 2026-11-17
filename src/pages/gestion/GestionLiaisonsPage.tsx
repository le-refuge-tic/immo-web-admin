import { useState, useEffect, useCallback } from 'react';
import { getDemandes } from '../../api/getDemandes';
import { apiMessage } from '../../utils/apiMessage';
import { DateInput, ErreurChamp, NumberInput } from '../../shared/saisie/champs';
import { idErreur, useValidation } from '../../shared/saisie/validation';
import { schemaLiaison } from '../../validation/schemas';

type Demande = {
  id: number;
  statut: string;
  created_at: string;
  bien?: {
    id: number;
    type: string;
    prix: number;
    amenites?: { sous_type?: string };
    localisation?: { adresse: string; ville: string; quartier?: string };
  };
  locataire?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
};

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#F59E0B',
  approuvee:  '#10B981',
  rejetee:    '#EF4444',
};

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  approuvee:  'Approuvée',
  rejetee:    'Rejetée',
};

const TYPE_LABELS: Record<string, string> = {
  entree_coucher:    'Entrée-Coucher',
  chambre_salon:     'Chambre-Salon',
  appartement:       'Appartement',
  appart_meuble:     'Appartement meublé',
  villa:             'Villa',
  maison_individuelle: 'Maison',
  terrain:           'Terrain',
  boutique:          'Boutique',
  bureau:            'Bureau',
  duplex:            'Duplex',
};

function sousTypeLabel(d: Demande): string {
  const sous = d.bien?.amenites?.sous_type;
  if (sous && TYPE_LABELS[sous]) return TYPE_LABELS[sous];
  const t = d.bien?.type ?? '';
  const map: Record<string, string> = {
    maison: 'Maison', appart_vide: 'Appartement', appart_meuble: 'Appartement meublé',
    guesthouse: 'Guesthouse', salle_fete: 'Salle de fêtes', terrain: 'Terrain',
  };
  return map[t] ?? t;
}

export default function GestionLiaisonsPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [filtre, setFiltre]     = useState('en_attente');
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<Demande | null>(null);
  const [form, setForm]         = useState({ date_debut: '', jour_echeance: '10', loyer_prepaye_mois: '0', notes: '' });
  const [error, setError]       = useState('');
  const v = useValidation('liaison', schemaLiaison, form);
  const submitting = v.envoiEnCours;
  const [confirmRejetId, setConfirmRejetId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDemandes.list(filtre || undefined);
      setDemandes(Array.isArray(data) ? data : data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [filtre]);

  useEffect(() => { load(); }, [load]);

  function handleValider() {
    if (!selected) return;
    setError('');
    void v.soumettre(async d => {
      try {
        await getDemandes.valider(selected.id, d);
        setSelected(null);
        load();
      } catch (e: any) {
        setError(apiMessage(e) ?? 'Erreur serveur');
      }
    });
  }

  async function handleRejeter(d: Demande) {
    await getDemandes.rejeter(d.id);
    setConfirmRejetId(null);
    load();
  }

  const locAdresse = (d: Demande) => {
    const l = d.bien?.localisation;
    if (!l) return '—';
    return [l.quartier, l.ville, l.adresse].filter(Boolean).join(', ');
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Liaisons locataire ↔ bien</h1>
          <p>Valider les demandes de rejoindre un bien en gestion</p>
        </div>
        <div className="immo-spacer" />
        <select className="immo-select" value={filtre} onChange={e => setFiltre(e.target.value)}>
          <option value="en_attente">En attente</option>
          <option value="approuvee">Approuvées</option>
          <option value="rejetee">Rejetées</option>
          <option value="">Toutes</option>
        </select>
      </div>

      <div className="immo-content">
        {loading ? (
          <p style={{ color: 'var(--c-muted)', padding: 32 }}>Chargement…</p>
        ) : demandes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64, color: 'var(--c-muted)' }}>
            <div style={{ fontSize: 48 }}>🔑</div>
            <p style={{ marginTop: 12 }}>Aucune demande {filtre === 'en_attente' ? 'en attente' : ''}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table className="immo-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Locataire</th>
                <th>Bien</th>
                <th>Localisation</th>
                <th>Loyer / mois</th>
                <th>Date demande</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {d.locataire?.prenom} {d.locataire?.nom}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                      {d.locataire?.telephone}<br />{d.locataire?.email}
                    </div>
                  </td>
                  <td>{sousTypeLabel(d)}</td>
                  <td style={{ fontSize: 13 }}>{locAdresse(d)}</td>
                  <td style={{ fontWeight: 700 }}>
                    {Number(d.bien?.prix ?? 0).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <span style={{
                      background: STATUT_COLORS[d.statut] + '22',
                      color: STATUT_COLORS[d.statut],
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {STATUT_LABELS[d.statut] ?? d.statut}
                    </span>
                  </td>
                  <td>
                    {d.statut === 'en_attente' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="immo-btn immo-btn-sm"
                          style={{ background: '#10B981', color: '#fff', border: 'none' }}
                          onClick={() => { setSelected(d); setError(''); }}
                        >
                          ✓ Valider
                        </button>
                        {confirmRejetId === d.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button className="immo-btn immo-btn-sm" style={{ background: '#EF4444', color: '#fff', border: 'none' }} onClick={() => handleRejeter(d)}>Confirmer</button>
                            <button className="immo-btn immo-btn-sm" onClick={() => setConfirmRejetId(null)}>Annuler</button>
                          </div>
                        ) : (
                          <button
                            className="immo-btn immo-btn-sm"
                            style={{ background: '#EF4444', color: '#fff', border: 'none' }}
                            onClick={() => setConfirmRejetId(d.id)}
                          >
                            ✗ Rejeter
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal validation */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--c-card)', borderRadius: 16, padding: 32, width: 'min(420px, 90vw)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Valider la liaison</h2>
            <p style={{ margin: '0 0 20px', color: 'var(--c-muted)', fontSize: 13 }}>
              {selected.locataire?.prenom} {selected.locataire?.nom} →{' '}
              {sousTypeLabel(selected)} · {locAdresse(selected)}
            </p>

            <label htmlFor="liaison-date_debut" style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Date de début du contrat *
            </label>
            <DateInput
              value={form.date_debut}
              onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
              {...v.propsChamp('date_debut')}
            />
            <ErreurChamp id={idErreur('liaison', 'date_debut')} message={v.erreurs.date_debut} />
            <div style={{ marginBottom: 14 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label htmlFor="liaison-jour_echeance" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Jour d'échéance (défaut : 10)
                </label>
                <NumberInput
                  min={1} max={28}
                  value={form.jour_echeance}
                  onChange={e => setForm(f => ({ ...f, jour_echeance: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  {...v.propsChamp('jour_echeance')}
                />
                <ErreurChamp id={idErreur('liaison', 'jour_echeance')} message={v.erreurs.jour_echeance} />
              </div>
              <div>
                <label htmlFor="liaison-loyer_prepaye_mois" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Mois de loyer prépayé
                </label>
                <NumberInput
                  min={0} max={12}
                  value={form.loyer_prepaye_mois}
                  onChange={e => setForm(f => ({ ...f, loyer_prepaye_mois: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 13, boxSizing: 'border-box' }}
                  {...v.propsChamp('loyer_prepaye_mois')}
                />
                <ErreurChamp id={idErreur('liaison', 'loyer_prepaye_mois')} message={v.erreurs.loyer_prepaye_mois} />
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              maxLength={1000}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--c-border)', borderRadius: 10, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', marginBottom: 14 }}
              placeholder="Conditions particulières, remarques…"
            />

            {error && (
              <p style={{ color: 'var(--s-red)', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                className="immo-btn"
                style={{ background: 'var(--c-surface-2)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
                onClick={() => setSelected(null)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                className="immo-btn"
                style={{ background: '#10B981', color: '#fff', border: 'none', minWidth: 120 }}
                onClick={handleValider}
                disabled={submitting}
              >
                {submitting ? 'En cours…' : 'Confirmer la liaison'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
