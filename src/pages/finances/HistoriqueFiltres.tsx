import { useState } from 'react';
import {
  libelle,
  LIBELLES_METHODE,
  LIBELLES_ROLE,
  LIBELLES_STATUT,
  LIBELLES_TYPE,
  PERIODES,
  typesProposes,
  type FiltresHistorique,
  type Periode,
} from '../../utils/historiqueTransactions';

interface Props {
  superAdmin: boolean;
  periode: Periode;
  filtres: FiltresHistorique;
  /** Clés imposées par l'onglet actif : affichées mais non modifiables. */
  verrouilles: (keyof FiltresHistorique)[];
  onChange: (periode: Periode, filtres: FiltresHistorique) => void;
}

const champ: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--c-muted)', minWidth: 140 };
const saisie: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-card)', color: 'var(--c-text)', fontSize: 13 };

const nombre = (v: string) => (v === '' ? undefined : Math.max(0, Number(v)));
const entier = (v: string) => {
  const n = Number(v);
  return v !== '' && Number.isInteger(n) && n > 0 ? n : undefined;
};

/** Barre de filtres repliable de l'historique des transactions. */
export default function HistoriqueFiltres({ superAdmin, periode, filtres, verrouilles, onChange }: Props) {
  const [ouvert, setOuvert] = useState(Object.keys(filtres).length > 0);
  const maj = (f: Partial<FiltresHistorique>) => onChange(periode, { ...filtres, ...f });
  const verrou = (k: keyof FiltresHistorique) => verrouilles.includes(k);
  const actifs = Object.keys(filtres).filter(k => (k !== 'du' && k !== 'au') || periode === 'perso').length;

  return (
    <div className="immo-card" style={{ padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {PERIODES.map(p => (
          <button
            key={p.id}
            type="button"
            aria-pressed={periode === p.id}
            onClick={() => onChange(p.id, filtres)}
            style={{
              padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${periode === p.id ? 'var(--c-blue)' : 'var(--c-border)'}`,
              background: periode === p.id ? 'var(--c-blue)' : 'transparent',
              color: periode === p.id ? '#fff' : 'var(--c-text)',
            }}
          >
            {p.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert}
          style={{ border: 'none', background: 'none', color: 'var(--c-blue)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          {ouvert ? 'Masquer les filtres' : `Plus de filtres${actifs ? ` (${actifs})` : ''}`}
        </button>
        {actifs > 0 && (
          <button type="button" onClick={() => onChange('tout', {})}
            style={{ border: 'none', background: 'none', color: 'var(--c-muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Réinitialiser
          </button>
        )}
      </div>

      {periode === 'perso' && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={champ}>Du
            <input type="date" style={saisie} value={filtres.du ?? ''} max={filtres.au} onChange={e => maj({ du: e.target.value || undefined })} />
          </label>
          <label style={champ}>Au
            <input type="date" style={saisie} value={filtres.au ?? ''} min={filtres.du} onChange={e => maj({ au: e.target.value || undefined })} />
          </label>
        </div>
      )}

      {ouvert && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <label style={champ}>Type
            <select style={saisie} disabled={verrou('types')} value={filtres.types?.[0] ?? ''}
              onChange={e => maj({ types: e.target.value ? [e.target.value] : undefined })}>
              <option value="">Tous les types</option>
              {typesProposes(superAdmin).map(t => <option key={t} value={t}>{libelle(LIBELLES_TYPE, t)}</option>)}
            </select>
          </label>
          <label style={champ}>Sens
            <select style={saisie} value={filtres.sens ?? ''} onChange={e => maj({ sens: (e.target.value || undefined) as FiltresHistorique['sens'] })}>
              <option value="">Entrées et sorties</option>
              <option value="credit">Entrées</option>
              <option value="debit">Sorties</option>
            </select>
          </label>
          <label style={champ}>Statut
            <select style={saisie} value={filtres.statut ?? ''} onChange={e => maj({ statut: e.target.value || undefined })}>
              <option value="">Tous les statuts</option>
              {['confirme', 'completed', 'en_attente', 'echoue', 'rembourse', 'anomalie'].map(s => (
                <option key={s} value={s}>{libelle(LIBELLES_STATUT, s)}</option>
              ))}
            </select>
          </label>
          <label style={champ}>Rôle
            <select style={saisie} disabled={verrou('roles')} value={filtres.roles?.[0] ?? ''}
              onChange={e => maj({ roles: e.target.value ? [e.target.value] : undefined })}>
              <option value="">Tous les rôles</option>
              {(superAdmin
                ? ['super_admin', 'admin', 'commercial', 'demarcheur', 'proprietaire', 'locataire', 'prospect', 'plateforme']
                : ['admin', 'commercial', 'demarcheur']
              ).map(r => <option key={r} value={r}>{libelle(LIBELLES_ROLE, r)}</option>)}
            </select>
          </label>
          {superAdmin && (
            <label style={champ}>Méthode
              <select style={saisie} value={filtres.methode ?? ''} onChange={e => maj({ methode: e.target.value || undefined })}>
                <option value="">Toutes</option>
                {Object.keys(LIBELLES_METHODE).map(m => <option key={m} value={m}>{LIBELLES_METHODE[m]}</option>)}
              </select>
            </label>
          )}
          <label style={champ}>N° utilisateur
            <input type="number" min={1} style={saisie} disabled={verrou('utilisateur_id')} value={filtres.utilisateur_id ?? ''}
              onChange={e => maj({ utilisateur_id: entier(e.target.value) })} />
          </label>
          <label style={champ}>N° bien
            <input type="number" min={1} style={saisie} value={filtres.bien_id ?? ''} onChange={e => maj({ bien_id: entier(e.target.value) })} />
          </label>
          <label style={champ}>Montant min (FCFA)
            <input type="number" min={0} style={saisie} value={filtres.montant_min ?? ''} onChange={e => maj({ montant_min: nombre(e.target.value) })} />
          </label>
          <label style={champ}>Montant max (FCFA)
            <input type="number" min={0} style={saisie} value={filtres.montant_max ?? ''} onChange={e => maj({ montant_max: nombre(e.target.value) })} />
          </label>
        </div>
      )}
    </div>
  );
}
