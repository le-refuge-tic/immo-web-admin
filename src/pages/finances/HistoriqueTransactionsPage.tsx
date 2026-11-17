import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiMessage } from '../../utils/apiMessage';
import { historiqueApi, type LigneHistorique, type PageHistorique } from '../../api/historiqueApi';
import { formatFcfa } from '../commercial/historiquePortefeuille';
import {
  basculerTri,
  dateHeureBenin,
  ecrireUrl,
  estAboutie,
  filtresEffectifs,
  filtresOnglet,
  libelle,
  LIBELLES_ROLE,
  LIBELLES_STATUT,
  LIBELLES_TYPE,
  lireUrl,
  nombrePages,
  ongletsPour,
  TAILLE_PAGE,
  type CleTri,
  type EtatHistorique,
  type FiltresHistorique,
} from '../../utils/historiqueTransactions';
import HistoriqueFiltres from './HistoriqueFiltres';
import HistoriqueDetail from './HistoriqueDetail';

/** Laisse le temps de finir la saisie d'un montant avant d'interroger le serveur. */
const DELAI_SAISIE_MS = 300;
const COLONNES = '1.1fr 1.3fr 1.4fr 1fr 0.9fr';

const lienBien = (id: number) => `/annonces/${id}`;

function Statut({ statut }: { statut: string | null }) {
  const couleur = estAboutie(statut) ? 'var(--s-green)' : statut === 'en_attente' || statut === 'pending' ? 'var(--c-blue)' : 'var(--s-red)';
  return <span style={{ fontSize: 11, fontWeight: 700, color: couleur }}>{libelle(LIBELLES_STATUT, statut)}</span>;
}

function Montant({ l }: { l: LigneHistorique }) {
  const debit = l.sens === 'debit';
  return (
    <span style={{ fontWeight: 700, color: debit ? 'var(--s-red)' : 'var(--s-green)', opacity: estAboutie(l.statut) ? 1 : 0.55, whiteSpace: 'nowrap' }}>
      {debit ? '−' : '+'} {formatFcfa(Number(l.montant))}
    </span>
  );
}

function Totaux({ page }: { page: PageHistorique }) {
  const t = page.totaux;
  const carte = (label: string, valeur: string, couleur?: string) => (
    <div className="mod-stat-card">
      <div>
        <div className="mod-stat-label">{label}</div>
        <div className="mod-stat-value" style={{ fontSize: 18, color: couleur }}>{valeur}</div>
      </div>
    </div>
  );
  return (
    <div className="mod-stat-cards" style={{ marginBottom: 14 }}>
      {carte('Opérations', String(t.nombre))}
      {carte('Entrées abouties', formatFcfa(t.entrees), 'var(--s-green)')}
      {carte('Sorties abouties', formatFcfa(t.sorties), 'var(--s-red)')}
      {carte('Solde net', `${t.net < 0 ? '−' : ''}${formatFcfa(Math.abs(t.net))}`)}
    </div>
  );
}

/**
 * Lot 17 — historique détaillé des transactions. Admin : ses mouvements et ceux des admins,
 * commerciaux et démarcheurs ; super admin : tout, paiements des clients compris. Filtres,
 * tri, onglets et page vivent dans l'URL (liens partageables, retour arrière fidèle).
 */
export default function HistoriqueTransactionsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const superAdmin = (user?.role_principal ?? user?.role) === 'super_admin';
  const moiId: number | undefined = user?.id;
  const [params, setParams] = useSearchParams();
  const cleUrl = params.toString();
  const etat = useMemo(() => lireUrl(new URLSearchParams(cleUrl), superAdmin), [cleUrl, superAdmin]);
  const effectifs = useMemo(() => filtresEffectifs(etat, moiId), [etat, moiId]);
  const cleRequete = JSON.stringify([effectifs, etat.tri, etat.page]);

  const [resultat, setResultat] = useState<PageHistorique | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [essai, setEssai] = useState(0);
  // Le détail est rattaché à l'URL : « Voir son historique » change l'URL et le ferme.
  const [detailOuvert, setDetailOuvert] = useState<{ ligne: LigneHistorique; url: string } | null>(null);
  const detail = detailOuvert?.url === cleUrl ? detailOuvert.ligne : null;
  const [exportEnCours, setExportEnCours] = useState<'csv' | 'xlsx' | null>(null);

  useEffect(() => {
    let annule = false;
    const minuteur = setTimeout(() => {
      setChargement(true);
      historiqueApi
        .lister(effectifs, etat.tri, etat.page, TAILLE_PAGE)
        .then(r => { if (!annule) { setResultat(r); setErreur(null); } })
        .catch(e => { if (!annule) setErreur(apiMessage(e) || 'Impossible de charger l’historique.'); })
        .finally(() => { if (!annule) setChargement(false); });
    }, DELAI_SAISIE_MS);
    return () => { annule = true; clearTimeout(minuteur); };
    // cleRequete résume effectifs, tri et page : inutile de relancer sur une nouvelle identité d'objet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleRequete, essai]);

  const aller = (e: Partial<EtatHistorique>, garderPage = false) =>
    setParams(ecrireUrl({ ...etat, ...e, page: garderPage ? e.page ?? etat.page : 1 }), { replace: !garderPage });

  const exporter = async (format: 'csv' | 'xlsx') => {
    setExportEnCours(format);
    try {
      await historiqueApi.exporter(effectifs, etat.tri, format);
      toast(`Export ${format.toUpperCase()} téléchargé.`);
    } catch (e) {
      toast(apiMessage(e) || 'L’export a échoué. Réessayez.', 'error');
    } finally {
      setExportEnCours(null);
    }
  };

  const verrouilles = Object.keys(filtresOnglet(etat.onglet, moiId)) as (keyof FiltresHistorique)[];
  const pages = nombrePages(resultat?.total ?? 0);
  const lignes = resultat?.data ?? [];

  const enTete = (cle: CleTri, titre: string) => {
    const actif = etat.tri.cle === cle;
    return (
      <button key={cle} type="button" className="mod-table-col" onClick={() => aller({ tri: basculerTri(etat.tri, cle) })}
        aria-sort={actif ? (etat.tri.ordre === 'asc' ? 'ascending' : 'descending') : 'none'}
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: actif ? 'var(--c-blue)' : undefined, fontFamily: 'inherit' }}>
        {titre} {actif ? (etat.tri.ordre === 'asc' ? '▲' : '▼') : ''}
      </button>
    );
  };

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Historique des transactions</h1>
          <p>{superAdmin ? 'Tous les paiements et mouvements de portefeuille' : 'Vos mouvements et ceux des admins, commerciaux et démarcheurs'}</p>
        </div>
        <div className="immo-spacer" />
        {(['csv', 'xlsx'] as const).map(f => (
          <button key={f} type="button" className="immo-select" style={{ marginLeft: 8, cursor: 'pointer', fontWeight: 600 }}
            disabled={!!exportEnCours || !resultat?.total} onClick={() => exporter(f)}>
            {exportEnCours === f ? 'Export…' : f === 'csv' ? 'Exporter CSV' : 'Exporter Excel'}
          </button>
        ))}
      </div>

      <div className="immo-page">
        <div className="ut-tabs" role="tablist" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
          {ongletsPour(superAdmin).map(o => (
            <button key={o.id} type="button" role="tab" aria-selected={etat.onglet === o.id}
              className={`ut-tab ${etat.onglet === o.id ? 'active' : ''}`} onClick={() => aller({ onglet: o.id })}>
              {o.label}
            </button>
          ))}
        </div>

        <HistoriqueFiltres
          superAdmin={superAdmin}
          periode={etat.periode}
          filtres={etat.filtres}
          verrouilles={verrouilles}
          onChange={(periode, filtres) => aller({ periode, filtres })}
        />

        {erreur && (
          <div role="alert" style={{ background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--s-red)', fontWeight: 500, marginBottom: 14 }}>
            {erreur}{' '}
            <button type="button" onClick={() => setEssai(n => n + 1)} style={{ background: 'none', border: 'none', color: 'var(--s-red)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Réessayer
            </button>
          </div>
        )}

        {resultat && <Totaux page={resultat} />}

        <div className="immo-card" style={{ padding: 0, overflowX: 'auto', opacity: chargement && resultat ? 0.6 : 1 }}>
          <div className="mod-table-header" style={{ gridTemplateColumns: COLONNES, minWidth: 760 }}>
            {enTete('date', 'Date')}
            {enTete('type', 'Type')}
            {enTete('utilisateur', 'Utilisateur')}
            {enTete('montant', 'Montant')}
            <span className="mod-table-col">Statut</span>
          </div>
          {chargement && !resultat ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
          ) : lignes.length === 0 && !erreur ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--c-muted)' }}>Aucune opération pour ces critères.</div>
          ) : lignes.map(l => (
            <button key={`${l.source}-${l.id}`} type="button" className="mod-row" onClick={() => setDetailOuvert({ ligne: l, url: cleUrl })}
              style={{ gridTemplateColumns: COLONNES, minWidth: 760, width: '100%', border: 'none', borderBottom: '1px solid var(--c-border)', background: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}>
              <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>{dateHeureBenin(l.date)}</span>
              <span style={{ fontSize: 13 }}>
                {libelle(LIBELLES_TYPE, l.type)}
                {l.bien_id != null && <span style={{ color: 'var(--c-muted)', fontSize: 11 }}> · bien #{l.bien_id}</span>}
              </span>
              <span style={{ fontSize: 13 }}>
                {l.utilisateur_nom || '—'}
                <span style={{ color: 'var(--c-muted)', fontSize: 11 }}> · {libelle(LIBELLES_ROLE, l.role_utilisateur)}</span>
                {l.contrepartie_nom && <span style={{ display: 'block', color: 'var(--c-muted)', fontSize: 11 }}>→ {l.contrepartie_nom}</span>}
              </span>
              <Montant l={l} />
              <Statut statut={l.statut} />
            </button>
          ))}
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--c-border)' }}>
            <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              {!resultat?.total ? '0 résultat' : `${(etat.page - 1) * TAILLE_PAGE + 1}–${Math.min(etat.page * TAILLE_PAGE, resultat.total)} sur ${resultat.total}`}
            </span>
            <div className="immo-pagination">
              <button type="button" className="page-btn" aria-label="Page précédente" disabled={etat.page <= 1} onClick={() => aller({ page: etat.page - 1 }, true)}><ChevronLeftIcon /></button>
              <span style={{ fontSize: 12, padding: '0 8px' }}>Page {etat.page} / {pages}</span>
              <button type="button" className="page-btn" aria-label="Page suivante" disabled={etat.page >= pages} onClick={() => aller({ page: etat.page + 1 }, true)}><ChevronRightIcon /></button>
            </div>
          </div>
        </div>
      </div>

      {detail && <HistoriqueDetail ligne={detail} lienBien={lienBien} onClose={() => setDetailOuvert(null)} />}
    </>
  );
}
