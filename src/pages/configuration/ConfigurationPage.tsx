import ConfigSection from './ConfigSection';
import ConfigRowItem from './ConfigRowItem';
import ConfigAdminsSection from './ConfigAdminsSection';

const TYPE_BIENS = [
  { key: 'maison',        label: 'Maison',              desc: 'Villa, maison individuelle, duplex' },
  { key: 'appart_vide',   label: 'Appartement vide',    desc: 'Appartement non meublé' },
  { key: 'appart_meuble', label: 'Appartement meublé',  desc: 'Appartement avec mobilier' },
  { key: 'guesthouse',    label: 'Guesthouse',           desc: 'Maison d\'hôtes, chambre d\'hôtes' },
  { key: 'terrain',       label: 'Terrain',              desc: 'Parcelle nue, terrain agricole ou constructible' },
];

const TRANSACTIONS = [
  { key: 'vente',    label: 'Vente',    desc: 'Cession définitive du bien' },
  { key: 'location', label: 'Location', desc: 'Mise en location mensuelle ou annuelle' },
];

const STATUTS_MODERATION = [
  { key: 'en_attente', label: 'En attente', color: '#D97706', desc: 'Annonce soumise, en attente de validation admin' },
  { key: 'approuve',   label: 'Approuvé',   color: '#16A34A', desc: 'Annonce validée et visible par les clients' },
  { key: 'rejete',     label: 'Rejeté',     color: '#DC2626', desc: 'Annonce rejetée, non visible' },
];

const ROLES_USERS = [
  { key: 'client',      label: 'Client',                   desc: 'Chercheur de bien (achat ou location)' },
  { key: 'detenteur',   label: 'Propriétaire / Bailleur',  desc: 'Publie des biens à vendre ou louer' },
  { key: 'super_admin', label: 'Administrateur',            desc: 'Accès complet à l\'interface d\'administration' },
];

export default function ConfigurationPage() {
  return (
    <>
      <div className="immo-topbar">
        <div className="immo-topbar-title">
          <h1>Configuration</h1>
          <p>Référentiels et paramètres de la plateforme</p>
        </div>
      </div>

      <div className="immo-page">
        <ConfigAdminsSection />

        <div className="content-grid-2">
          <ConfigSection title="Types de biens gérés">
            {TYPE_BIENS.map((t) => (
              <ConfigRowItem key={t.key} label={t.label} desc={t.desc} badge={t.key.toUpperCase()} />
            ))}
          </ConfigSection>

          <ConfigSection title="Types de transactions">
            {TRANSACTIONS.map((t) => (
              <ConfigRowItem key={t.key} label={t.label} desc={t.desc} badge={t.key.toUpperCase()} />
            ))}
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--c-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-muted)', marginBottom: 4 }}>À venir</div>
              <div style={{ fontSize: 13, color: 'var(--c-text)' }}>Colocation, bail commercial, viager…</div>
            </div>
          </ConfigSection>

          <ConfigSection title="Workflow de modération">
            {STATUTS_MODERATION.map((s) => (
              <ConfigRowItem key={s.key} label={s.label} desc={s.desc} badge={s.label.toUpperCase()} badgeColor={s.color} />
            ))}
          </ConfigSection>

          <ConfigSection title="Rôles utilisateurs">
            {ROLES_USERS.map((r) => (
              <ConfigRowItem key={r.key} label={r.label} desc={r.desc} />
            ))}
          </ConfigSection>
        </div>

        <div className="immo-card" style={{ padding: '16px 24px' }}>
          <div className="section-header">
            <span className="section-title">Connexion API</span>
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>URL Backend</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>
                {import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>Version API</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>v1</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-muted)', textTransform: 'uppercase' }}>Authentification</div>
              <div style={{ fontSize: 13, fontFamily: 'monospace', marginTop: 4 }}>JWT Bearer</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
