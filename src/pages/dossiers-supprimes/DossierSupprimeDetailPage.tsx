import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '../../components/Icons';
import { AccesReserve } from '../../components/AccesSuperAdmin';
import { dossiersSupprimes, type BienDossier, type DetailDossier } from '../../api/dossiersSupprimes';
import { apiMessage } from '../../utils/apiMessage';
import { dateCourte } from '../../utils/statutCompte';
import { libelleStatutBien } from '../../utils/statutBien';
import { LIBELLES_ROLE, LIBELLES_STATUT, LIBELLES_TYPE, dateHeureBenin, libelle } from '../../utils/historiqueTransactions';

const BANDEAU = 'Données conservées pour des raisons de sécurité et d\'obligations légales. Toute consultation est enregistrée.';

const TYPES_BIEN: Record<string, string> = {
  maison: 'Maison',
  appart_vide: 'Appartement',
  appart_meuble: 'Appartement meublé',
  terrain: 'Terrain',
  boutique: 'Boutique / Local',
  bureau: 'Bureau',
  guesthouse: 'Guesthouse',
  salle_fete: 'Salle de fêtes',
};

/** Le bien n'a pas de titre en base : type et localisation, comme sur les cartes d'annonces. */
function titreBien(b: BienDossier): string {
  if (b.titre) return b.titre;
  const type = libelle(TYPES_BIEN, b.type);
  const lieu = [b.localisation?.quartier, b.localisation?.ville].filter(Boolean).join(', ');
  return `${type}${lieu ? ` – ${lieu}` : ''} (n° ${b.id})`;
}

function montant(v: number | string): string {
  const n = Number(v);
  return Number.isFinite(n) ? `${n.toLocaleString('fr-FR')} FCFA` : String(v);
}

function Champ({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--c-text)', marginTop: 2, wordBreak: 'break-word' }}>{children}</div>
    </div>
  );
}

const carte: React.CSSProperties = {
  background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: 14, padding: 20,
};

export default function DossierSupprimeDetailPage() {
  const { id } = useParams();
  const [detail, setDetail]     = useState<DetailDossier | null>(null);
  const [loading, setLoading]   = useState(true);
  const [erreur, setErreur]     = useState('');
  const [interdit, setInterdit] = useState(false);

  useEffect(() => {
    let annule = false;
    setLoading(true);
    setErreur('');
    dossiersSupprimes.detail(Number(id))
      .then(d => { if (!annule) setDetail(d); })
      .catch((err: any) => {
        if (annule) return;
        if (err?.response?.status === 403) setInterdit(true);
        else setErreur(apiMessage(err) ?? 'Erreur lors du chargement du dossier.');
      })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [id]);

  if (interdit) return <AccesReserve />;

  const d = detail?.dossier;

  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Dossier supprimé{d ? ` – ${[d.prenom, d.nom].filter(Boolean).join(' ') || `n° ${d.id}`}` : ''}</h1>
          <p>Lecture seule</p>
        </div>
        <div className="immo-spacer" />
        <Link to="/dossiers-supprimes" className="btn-cancel" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <ChevronLeftIcon /> Retour à la liste
        </Link>
      </div>

      <div className="immo-page">
        <div
          role="note"
          style={{
            background: 'var(--t-yellow-bg)', border: '1px solid #FDE68A', borderRadius: 8,
            padding: '12px 16px', fontSize: 13, color: 'var(--s-yellow)', fontWeight: 600,
          }}
        >
          {BANDEAU}
        </div>

        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--c-muted)' }}>Chargement…</div>
        ) : erreur ? (
          <div role="alert" style={{ background: 'var(--t-red-bg)', border: '1px solid var(--t-red-bd)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: 'var(--s-red)', fontWeight: 500 }}>
            {erreur}
          </div>
        ) : d && detail && (
          <>
            <section style={carte} aria-labelledby="titre-identite">
              <h2 id="titre-identite" style={{ fontSize: 15, margin: '0 0 14px' }}>Identité</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                <Champ label="Nom">{d.nom || '—'}</Champ>
                <Champ label="Prénom">{d.prenom || '—'}</Champ>
                <Champ label="Téléphone">{d.telephone || '—'}</Champ>
                <Champ label="Email">{d.email || '—'}</Champ>
                <Champ label="Rôle">{libelle(LIBELLES_ROLE, d.role)}</Champ>
                <Champ label="Compte créé le">{dateCourte(d.date_creation_compte) ?? '—'}</Champ>
                <Champ label="Suppression demandée le">{dateCourte(d.suppression_demandee_le) ?? '—'}</Champ>
                <Champ label="Supprimé le">{dateCourte(d.suppression_effective_le) ?? '—'}</Champ>
                <Champ label="Purge prévue">{dateCourte(d.purge_prevue_le) ?? 'Non planifiée'}</Champ>
                {d.motif && <Champ label="Motif">{d.motif}</Champ>}
              </div>
            </section>

            <section style={{ ...carte, padding: 0 }} aria-labelledby="titre-transactions">
              <h2 id="titre-transactions" style={{ fontSize: 15, margin: 0, padding: '16px 20px' }}>
                Transactions ({detail.transactions.length})
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="tableau-lecture">
                  <thead>
                    <tr><th>Date</th><th>Montant</th><th>Type</th><th>Statut</th><th>Référence</th></tr>
                  </thead>
                  <tbody>
                    {detail.transactions.length === 0 ? (
                      <tr><td colSpan={5} className="ut-state-cell">Aucune transaction.</td></tr>
                    ) : detail.transactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{dateHeureBenin(t.created_at)}</td>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{montant(t.montant)}</td>
                        <td>{libelle(LIBELLES_TYPE, t.type)}</td>
                        <td>{libelle(LIBELLES_STATUT, t.statut)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{t.reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={{ ...carte, padding: 0 }} aria-labelledby="titre-biens">
              <h2 id="titre-biens" style={{ fontSize: 15, margin: 0, padding: '16px 20px' }}>
                Biens ({detail.biens.length})
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="tableau-lecture">
                  <thead>
                    <tr><th>Titre</th><th>Statut</th></tr>
                  </thead>
                  <tbody>
                    {detail.biens.length === 0 ? (
                      <tr><td colSpan={2} className="ut-state-cell">Aucun bien.</td></tr>
                    ) : detail.biens.map(b => (
                      <tr key={b.id}>
                        <td>{titreBien(b)}</td>
                        <td>{libelleStatutBien(b.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
