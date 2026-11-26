import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { AccesReserve } from '../../components/AccesSuperAdmin';
import { dossiersSupprimes, type DossierSupprime } from '../../api/dossiersSupprimes';
import { apiMessage } from '../../utils/apiMessage';
import { dateCourte } from '../../utils/statutCompte';
import { LIBELLES_ROLE, libelle } from '../../utils/historiqueTransactions';

const LIMIT = 20;
/** Délai avant d'interroger le serveur pendant la saisie de la recherche. */
const DELAI_RECHERCHE_MS = 350;

export default function DossiersSupprimesPage() {
  const navigate = useNavigate();
  const [dossiers, setDossiers] = useState<DossierSupprime[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [saisie, setSaisie]     = useState('');
  const [q, setQ]               = useState('');
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState('');
  const [interdit, setInterdit] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQ(saisie.trim()); setPage(1); }, DELAI_RECHERCHE_MS);
    return () => clearTimeout(t);
  }, [saisie]);

  const load = useCallback(async () => {
    setLoading(true);
    setErreur('');
    try {
      const res = await dossiersSupprimes.lister({ page, limit: LIMIT, q: q || undefined });
      setDossiers(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err: any) {
      if (err?.response?.status === 403) setInterdit(true);
      else setErreur(apiMessage(err) ?? 'Erreur lors du chargement des dossiers.');
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  if (interdit) return <AccesReserve />;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Dossiers supprimés</h1>
          <p>{total} dossier{total !== 1 ? 's' : ''} de comptes supprimés, en lecture seule</p>
        </div>
        <div className="immo-spacer" />
        <div className="immo-search-wrap">
          <SearchIcon />
          <input
            placeholder="Rechercher par téléphone ou nom…"
            value={saisie}
            onChange={e => setSaisie(e.target.value)}
            aria-label="Rechercher un dossier par téléphone ou nom"
          />
        </div>
      </div>

      <div className="immo-page">
        {erreur && (
          <div role="alert" style={{ background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--s-red)', fontWeight: 500 }}>
            {erreur}{' '}
            <button onClick={load} style={{ background: 'none', border: 'none', color: 'var(--s-red)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Réessayer
            </button>
          </div>
        )}

        <div className="ut-table-wrap">
          <table className="tableau-lecture">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Date de suppression</th>
                <th>Purge prévue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="ut-state-cell">Chargement…</td></tr>
              ) : dossiers.length === 0 ? (
                <tr><td colSpan={6} className="ut-state-cell">Aucun dossier trouvé.</td></tr>
              ) : dossiers.map(d => (
                <tr
                  key={d.id}
                  className="cliquable"
                  tabIndex={0}
                  onClick={() => navigate(`/dossiers-supprimes/${d.id}`)}
                  onKeyDown={e => { if (e.key === 'Enter') navigate(`/dossiers-supprimes/${d.id}`); }}
                  title="Voir le dossier"
                >
                  <td style={{ fontWeight: 600 }}>{d.nom || '—'}</td>
                  <td>{d.prenom || '—'}</td>
                  <td>{d.telephone || '—'}</td>
                  <td>{libelle(LIBELLES_ROLE, d.role)}</td>
                  <td>{dateCourte(d.suppression_effective_le) ?? '—'}</td>
                  <td>{dateCourte(d.purge_prevue_le) ?? 'Non planifiée'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="ut-footer">
            <span className="ut-count">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} sur {total} dossiers
            </span>
            <div className="immo-pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Page précédente">
                <ChevronLeftIcon />
              </button>
              <span style={{ fontSize: 12, color: 'var(--c-muted)', padding: '0 8px' }}>Page {page} sur {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Page suivante">
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
