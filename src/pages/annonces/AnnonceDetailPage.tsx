import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { deleteAdminBien } from '../../api/deleteAdminBien';
import { ChevronLeftIcon, PinIcon, TrashIcon, EditIcon } from '../../components/Icons';
import { useAuth } from '../../context/AuthContext';

// ── Labels lisibles pour les champs amenites ────────────────────────────────
const AMENITE_FIELD_GROUPS = [
  {
    title: 'Caractéristiques',
    fields: [
      { key: 'parking',          label: 'Parking',            fmt: (v: any, a: any) => v ? (a.parking_capacite ? `Oui — ×${a.parking_capacite}` : 'Oui') : 'Non' },
      { key: 'cour',             label: 'Cour',               fmt: (v: any) => v ? 'Oui' : 'Non' },
      { key: 'boyerie',          label: 'Boyerie',            fmt: (v: any) => v ? 'Oui' : 'Non' },
      { key: 'sanitaire',        label: 'Sanitaires',         fmt: (v: any) => v == null ? null : (v ? 'Intérieur' : 'Extérieur') },
      { key: 'chambre_couloir',  label: 'Maison à couloir',   fmt: (v: any) => v == null ? null : (v ? 'Oui' : 'Non') },
      { key: 'acces_vehicule',   label: 'Accès véhicule',     fmt: (v: any, a: any) => v == null ? null : (v ? (a.nb_vehicules ? `Oui — ${a.nb_vehicules} véh.` : 'Oui') : 'Non') },
    ],
  },
  {
    title: 'Équipements',
    fields: [
      { key: 'electricite_label', label: 'Électricité', fmt: (v: any) => v || null },
      { key: 'eau_label',         label: 'Eau',         fmt: (v: any) => v || null },
      { key: 'cuisine_label',     label: 'Cuisine',     fmt: (v: any) => v || null },
      { key: 'finition_label',    label: 'Finition',    fmt: (v: any) => v || null },
    ],
  },
  {
    title: 'Conditions financières',
    fields: [
      { key: 'avance_mois',          label: 'Avance',             fmt: (v: any) => v > 0 ? `${v} mois` : null },
      { key: 'loyer_pre_paye_mois',  label: 'Loyer prépayé',      fmt: (v: any) => v > 0 ? `${v} mois` : null },
      { key: 'caution_eau',          label: 'Caution eau',         fmt: (v: any) => v > 0 ? `${Number(v).toLocaleString('fr-FR')} FCFA` : null },
      { key: 'caution_elec',         label: 'Caution élec.',       fmt: (v: any) => v > 0 ? `${Number(v).toLocaleString('fr-FR')} FCFA` : null },
      { key: 'commission_agence',    label: 'Commission agence',   fmt: (_v: any, _a: any, bien?: any) => {
        const role = bien?.user?.role_principal ?? bien?.user?.role;
        if (role === 'proprietaire' || role === 'locataire' || role === 'prospect') return '500 FCFA (fixe Refuge)';
        const v = _v;
        return v > 0 ? `${Number(v).toLocaleString('fr-FR')} FCFA` : '—';
      }},
      { key: 'echeance_mois',        label: 'Échéance loyer',      fmt: (v: any) => v > 1 ? `${v} mois` : null },
    ],
  },
];

const TYPE_LABELS: any = {
  maison:        'Maison',
  appart_vide:   'Appartement vide',
  appart_meuble: 'Appartement meublé',
  guesthouse:    'Guesthouse',
  terrain:       'Terrain',
};

const MOD_BADGE: any = {
  en_attente:   { label: 'En attente',   cls: 'pending'  },
  approuve:     { label: 'Approuvé',     cls: 'verified' },
  rejete:       { label: 'Rejeté',       cls: 'danger'   },
  conditionnel: { label: 'Conditionnel', cls: 'pending'  },
};

const STATUT_BIEN: any = {
  actif:   'Actif',
  vendu:   'Vendu',
  loue:    'Loué',
  archive: 'Archivé',
};

const ROLE_LABELS: any = {
  prospect:     'Prospect',
  locataire:    'Locataire',
  proprietaire: 'Propriétaire',
  demarcheur:   'Démarcheur',
};

function formatPrice(v: any) {
  return Number(v).toLocaleString('fr-FR');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AnnonceDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCommercial = (user?.role_principal ?? user?.role) === 'commercial';
  const isSuperAdmin = user?.role === 'super_admin';
  const canModerate  = user?.role === 'admin' || user?.role === 'super_admin';

  const [bien, setBien]         = useState(null as any);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [action, setAction]     = useState(null as any);
  const [motif, setMotif]       = useState('');
  const [conditions, setConditions] = useState('');
  const [fraisVisite, setFraisVisite] = useState('0');

  // Édition proprietaire_info (super admin uniquement)
  const [editProprietaire, setEditProprietaire] = useState(false);
  const [propPrenom, setPropPrenom]   = useState('');
  const [propNom, setPropNom]         = useState('');
  const [propTel, setPropTel]         = useState('');
  const [propEmail, setPropEmail]     = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getAdminBien.byId(Number(id))
      .then(data => {
        setBien(data);
        setFraisVisite(String(data.frais_visite ?? 0));
        const pi = data.amenites?.proprietaire_info;
        if (pi) {
          setPropPrenom(pi.prenom ?? '');
          setPropNom(pi.nom ?? '');
          setPropTel(pi.telephone ?? '');
          setPropEmail(pi.email ?? '');
        }
      })
      .catch(() => setError('Impossible de charger ce bien. Vérifie que le backend est bien déployé.'))
      .finally(() => setLoading(false));
  }, [id]);

  const allPhotos: any[] = bien
    ? [
        ...(bien.photos ?? []),
        ...(bien.pieces ?? []).flatMap((p: any) => p.photos ?? []),
      ]
    : [];

  async function handleModerate(statut: string, extra?: any) {
    setSaving(true);
    try {
      await patchAdminBien.moderate(bien.id, { statut_moderation: statut, ...extra });
      const updated = await getAdminBien.byId(bien.id);
      setBien(updated);
      setFraisVisite(String(updated.frais_visite ?? 0));
      setAction(null);
      setMotif('');
      setConditions('');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProprietaire() {
    if (!propNom.trim() || !propPrenom.trim() || !propTel.trim()) return;
    setSaving(true);
    try {
      const updated = await patchAdminBien.update(bien.id, {
        amenites: {
          ...bien.amenites,
          proprietaire_info: {
            prenom: propPrenom.trim(),
            nom: propNom.trim(),
            telephone: propTel.trim(),
            email: propEmail.trim() || undefined,
          },
        },
      });
      setBien((prev: any) => ({ ...prev, ...updated }));
      setEditProprietaire(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    try {
      if (Number(fraisVisite) !== Number(bien.frais_visite)) {
        await patchAdminBien.update(bien.id, { frais_visite: Number(fraisVisite) });
      }
      await patchAdminBien.moderate(bien.id, { statut_moderation: 'approuve' });
      const updated = await getAdminBien.byId(bien.id);
      setBien(updated);
      setFraisVisite(String(updated.frais_visite ?? 0));
      setAction(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement ce bien ? Cette action est irréversible.')) return;
    setSaving(true);
    try {
      await deleteAdminBien.byId(bien.id);
      navigate('/annonces');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--c-muted)' }}>
        Chargement…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ color: 'var(--c-red)', fontWeight: 600 }}>{error}</div>
        <button className="detail-back-btn" onClick={() => navigate('/annonces')}>
          <ChevronLeftIcon size={16} /> Retour aux annonces
        </button>
      </div>
    );
  }

  if (!bien) return null;

  const mod   = bien.statut_moderation ?? 'en_attente';
  const badge = MOD_BADGE[mod] ?? MOD_BADGE.en_attente;

  return (
    <>
      {/* ── Topbar ── */}
      <div className="immo-topbar">
        <button className="detail-back-btn" onClick={() => navigate('/annonces')}>
          <ChevronLeftIcon size={16} />
          Retour aux annonces
        </button>
        <div className="immo-spacer" />
        <span className={`badge-statut badge-verif ${badge.cls}`} style={{ fontSize: 11 }}>
          {badge.label}
        </span>
        {!isCommercial && (
          <button className="detail-edit-btn" onClick={() => navigate(`/annonces/${id}/modifier`)}>
            <EditIcon size={14} />
            Modifier
          </button>
        )}
      </div>

      <div className="immo-page detail-page-layout">

        {/* ════════════ Colonne gauche ════════════ */}
        <div className="detail-left">

          {/* Galerie photos */}
          {allPhotos.length > 0 ? (
            <div className="detail-gallery">
              <div className="detail-gallery-main">
                <img src={allPhotos[photoIdx]?.url} alt="Photo du bien" />
                {allPhotos.length > 1 && (
                  <>
                    <button
                      className="detail-gallery-nav prev"
                      onClick={() => setPhotoIdx(i => (i - 1 + allPhotos.length) % allPhotos.length)}
                    >‹</button>
                    <button
                      className="detail-gallery-nav next"
                      onClick={() => setPhotoIdx(i => (i + 1) % allPhotos.length)}
                    >›</button>
                    <span className="detail-gallery-counter">{photoIdx + 1} / {allPhotos.length}</span>
                  </>
                )}
              </div>
              {allPhotos.length > 1 && (
                <div className="detail-gallery-thumbs">
                  {allPhotos.map((ph: any, i: number) => (
                    <img
                      key={ph.id ?? i}
                      src={ph.url}
                      className={`detail-gallery-thumb${photoIdx === i ? ' active' : ''}`}
                      onClick={() => setPhotoIdx(i)}
                      alt=""
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="detail-no-photo">Aucune photo disponible</div>
          )}

          {/* Description */}
          {bien.description && (
            <div className="detail-section">
              <div className="detail-section-title">Description</div>
              <p className="detail-description">{bien.description}</p>
            </div>
          )}

          {/* Aménités & équipements — affichage structuré par groupes */}
          {bien.amenites && (
            <div className="detail-section">
              <div className="detail-section-title">Aménités &amp; équipements</div>

              {/* Composition (pièces groupées) */}
              {bien.pieces?.length > 0 && (() => {
                const counts: Record<string, number> = {};
                for (const p of bien.pieces) counts[p.nom] = (counts[p.nom] ?? 0) + 1;
                return (
                  <div className="detail-amenites-group">
                    <div className="detail-amenites-group-title">Composition</div>
                    <div className="detail-amenites-rows">
                      {Object.entries(counts).map(([nom, n]) => (
                        <div className="detail-amenite-row" key={nom}>
                          <span className="detail-amenite-key">{nom}</span>
                          <span className="detail-amenite-val">{n as number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Groupes structurés */}
              {AMENITE_FIELD_GROUPS.map(group => {
                const rows = group.fields
                  .map(f => ({ label: f.label, value: (f.fmt as any)(bien.amenites[f.key], bien.amenites, bien) }))
                  .filter(r => r.value != null);
                if (rows.length === 0) return null;
                return (
                  <div className="detail-amenites-group" key={group.title}>
                    <div className="detail-amenites-group-title">{group.title}</div>
                    <div className="detail-amenites-rows">
                      {rows.map(r => (
                        <div className="detail-amenite-row" key={r.label}>
                          <span className="detail-amenite-key">{r.label}</span>
                          <span className="detail-amenite-val">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Voisinage */}
              {bien.amenites.voisinage?.length > 0 && (
                <div className="detail-amenites-group">
                  <div className="detail-amenites-group-title">Voisinage</div>
                  <div className="detail-amenites-tags">
                    {bien.amenites.voisinage.map((tag: string) => (
                      <span className="detail-amenite-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════ Colonne droite (sticky) ════════════ */}
        <div className="detail-right">

          {/* En-tête bien */}
          <div className="detail-card">
            <div className="detail-bien-type">{TYPE_LABELS[bien.type] ?? bien.type}</div>
            <div className="detail-bien-price">
              {formatPrice(bien.prix)} <span>FCFA</span>
            </div>
            <div className="detail-bien-price-type">
              {bien.transaction === 'vente' ? 'Prix de vente' : 'Loyer mensuel'}
            </div>
            {bien.localisation && (
              <div className="detail-bien-location">
                <PinIcon size={13} />
                {bien.localisation.ville}
                {bien.localisation.quartier ? `, ${bien.localisation.quartier}` : ''}
              </div>
            )}
          </div>

          {/* Infos générales */}
          <div className="detail-card">
            <div className="detail-section-title">Informations</div>
            <div className="detail-info-rows">
              <div className="detail-info-row">
                <span>Statut bien</span>
                <strong>{STATUT_BIEN[bien.statut] ?? bien.statut}</strong>
              </div>
              <div className="detail-info-row">
                <span>Frais de visite</span>
                <strong>{fraisVisite} FCFA</strong>
              </div>
              {bien.details_maison && (
                <>
                  <div className="detail-info-row">
                    <span>Superficie</span>
                    <strong>{formatPrice(bien.details_maison.superficie)} m²</strong>
                  </div>
                  <div className="detail-info-row">
                    <span>Clôturée</span>
                    <strong>{bien.details_maison.cloture ? 'Oui' : 'Non'}</strong>
                  </div>
                </>
              )}
              {bien.details_appart && (
                <div className="detail-info-row">
                  <span>Entrée personnelle</span>
                  <strong>{bien.details_appart.entree_personnelle ? 'Oui' : 'Non'}</strong>
                </div>
              )}
              {bien.details_terrain && (
                <>
                  <div className="detail-info-row">
                    <span>Superficie</span>
                    <strong>{formatPrice(bien.details_terrain.superficie)} m²</strong>
                  </div>
                  <div className="detail-info-row">
                    <span>Clôturé</span>
                    <strong>{bien.details_terrain.cloture ? 'Oui' : 'Non'}</strong>
                  </div>
                </>
              )}
              <div className="detail-info-row">
                <span>Score qualité</span>
                <strong>{Number(bien.score_qualite).toFixed(1)} / 5</strong>
              </div>
              <div className="detail-info-row">
                <span>Consultations</span>
                <strong>{bien.nb_consultations}</strong>
              </div>
              <div className="detail-info-row">
                <span>Publié le</span>
                <strong>{formatDate(bien.created_at)}</strong>
              </div>
            </div>
          </div>

          {/* Localisation */}
          {bien.localisation && (
            <div className="detail-card">
              <div className="detail-section-title">Localisation</div>
              <div className="detail-info-rows">
                <div className="detail-info-row">
                  <span>Adresse</span>
                  <strong>{bien.localisation.adresse}</strong>
                </div>
                <div className="detail-info-row">
                  <span>Ville</span>
                  <strong>{bien.localisation.ville}</strong>
                </div>
                <div className="detail-info-row">
                  <span>Quartier</span>
                  {bien.localisation.quartier
                    ? <strong>{bien.localisation.quartier}</strong>
                    : <strong style={{ color: 'var(--c-muted)' }}>—</strong>}
                </div>
                <div className="detail-info-row">
                  <span>GPS</span>
                  <strong>{Number(bien.localisation.latitude).toFixed(5)}, {Number(bien.localisation.longitude).toFixed(5)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Commercial / Auteur */}
          {bien.user && (
            <div className="detail-card">
              <div className="detail-section-title">
                {(bien.user.role_principal === 'commercial' || bien.user.role === 'commercial') ? 'Commercial ayant ajouté le bien' : 'Auteur'}
              </div>
              <div className="detail-author-row">
                <div className="detail-author-avatar">
                  {bien.user.prenom?.[0]}{bien.user.nom?.[0]}
                </div>
                <div>
                  <div className="detail-author-name">{bien.user.prenom} {bien.user.nom}</div>
                  <div className="detail-author-email">{bien.user.email}</div>
                  <div className="detail-author-role">{ROLE_LABELS[bien.user.role_principal] ?? bien.user.role_principal}</div>
                </div>
              </div>
            </div>
          )}

          {/* Propriétaire du bien (renseigné par le commercial) */}
          {bien.amenites?.proprietaire_info && (
            <div className="detail-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="detail-section-title" style={{ margin: 0 }}>Propriétaire du bien</div>
                {isSuperAdmin && !editProprietaire && (
                  <button onClick={() => setEditProprietaire(true)} style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    border: '1.5px solid var(--c-border)', background: 'transparent',
                    color: 'var(--c-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Modifier
                  </button>
                )}
              </div>
              {editProprietaire && isSuperAdmin ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label className="detail-form-label">Prénom *</label>
                      <input className="immo-form-input" value={propPrenom} onChange={e => setPropPrenom(e.target.value)} placeholder="Prénom" />
                    </div>
                    <div>
                      <label className="detail-form-label">Nom *</label>
                      <input className="immo-form-input" value={propNom} onChange={e => setPropNom(e.target.value)} placeholder="Nom" />
                    </div>
                  </div>
                  <div>
                    <label className="detail-form-label">Téléphone *</label>
                    <input className="immo-form-input" type="tel" value={propTel} onChange={e => setPropTel(e.target.value)} placeholder="+229 XX XX XX XX" />
                  </div>
                  <div>
                    <label className="detail-form-label">Email (optionnel)</label>
                    <input className="immo-form-input" type="email" value={propEmail} onChange={e => setPropEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button className="btn-cancel" onClick={() => { setEditProprietaire(false); const pi = bien.amenites?.proprietaire_info; if (pi) { setPropPrenom(pi.prenom ?? ''); setPropNom(pi.nom ?? ''); setPropTel(pi.telephone ?? ''); setPropEmail(pi.email ?? ''); } }}>
                      Annuler
                    </button>
                    <button className="btn-submit" onClick={handleSaveProprietaire}
                      disabled={saving || !propNom.trim() || !propPrenom.trim() || !propTel.trim()}>
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="detail-info-rows">
                  {['prenom', 'nom', 'telephone', 'email'].map(k => bien.amenites.proprietaire_info[k] ? (
                    <div className="detail-info-row" key={k}>
                      <span style={{ textTransform: 'capitalize' }}>{k}</span>
                      <strong style={{ color: k === 'nom' || k === 'prenom' ? 'var(--c-text)' : undefined }}>
                        {bien.amenites.proprietaire_info[k]}
                      </strong>
                    </div>
                  ) : null)}
                </div>
              )}
            </div>
          )}

          {/* Admin approbateur */}
          {bien.approved_by && (
            <div className="detail-card">
              <div className="detail-section-title">Approuvé par</div>
              <div className="detail-author-row">
                <div className="detail-author-avatar">
                  {bien.approved_by.prenom?.[0]}{bien.approved_by.nom?.[0]}
                </div>
                <div>
                  <div className="detail-author-name">{bien.approved_by.prenom} {bien.approved_by.nom}</div>
                  <div className="detail-author-email">{bien.approved_by.email}</div>
                  <div className="detail-author-role">{ROLE_LABELS[bien.approved_by.role_principal] ?? bien.approved_by.role_principal}</div>
                </div>
              </div>
            </div>
          )}

          {/* Historique modération */}
          {(bien.motif_refus || bien.conditions_speciales) && (
            <div className="detail-card detail-card--warn">
              <div className="detail-section-title">Modération</div>
              {bien.motif_refus && (
                <div className="detail-mod-block">
                  <div className="detail-mod-label">Motif de refus</div>
                  <div className="detail-mod-text">{bien.motif_refus}</div>
                </div>
              )}
              {bien.conditions_speciales && (
                <div className="detail-mod-block">
                  <div className="detail-mod-label">Conditions spéciales</div>
                  <div className="detail-mod-text">{bien.conditions_speciales}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Zone d'actions modération ── */}
          {canModerate && <div className="detail-card detail-card--actions">
            <div className="detail-section-title">Actions de modération</div>

            {action === null ? (
              <div className="detail-action-btns">
                {mod !== 'approuve' && (
                  <button
                    className="detail-btn detail-btn--approve"
                    onClick={handleApprove}
                    disabled={saving}
                  >
                    ✓ Approuver
                  </button>
                )}
                {mod !== 'rejete' && (
                  <button
                    className="detail-btn detail-btn--reject"
                    onClick={() => setAction('rejeter')}
                    disabled={saving}
                  >
                    ✗ Rejeter
                  </button>
                )}
                {mod !== 'conditionnel' && (
                  <button
                    className="detail-btn detail-btn--cond"
                    onClick={() => setAction('conditionnel')}
                    disabled={saving}
                  >
                    ⚠ Conditionnel
                  </button>
                )}
                {mod === 'approuve' && (
                  <button
                    className="detail-btn detail-btn--revoke"
                    onClick={() => handleModerate('en_attente')}
                    disabled={saving}
                  >
                    ↩ Révoquer l'approbation
                  </button>
                )}
              </div>
            ) : action === 'rejeter' ? (
              <div className="detail-action-form">
                <label className="detail-form-label">Motif de refus <span style={{ color: 'var(--c-red)' }}>*</span></label>
                <textarea
                  className="detail-form-textarea"
                  placeholder="Expliquer la raison du rejet…"
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="detail-form-row">
                  <button className="detail-btn detail-btn--cancel" onClick={() => setAction(null)}>Annuler</button>
                  <button
                    className="detail-btn detail-btn--reject"
                    disabled={!motif.trim() || saving}
                    onClick={() => handleModerate('rejete', { motif_refus: motif.trim() })}
                  >
                    {saving ? 'Enregistrement…' : 'Confirmer le rejet'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="detail-action-form">
                <label className="detail-form-label">Conditions spéciales</label>
                <textarea
                  className="detail-form-textarea"
                  placeholder="Conditions imposées pour publication…"
                  value={conditions}
                  onChange={e => setConditions(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="detail-form-row">
                  <button className="detail-btn detail-btn--cancel" onClick={() => setAction(null)}>Annuler</button>
                  <button
                    className="detail-btn detail-btn--cond"
                    disabled={saving}
                    onClick={() => handleModerate('conditionnel', { conditions_speciales: conditions.trim() })}
                  >
                    {saving ? 'Enregistrement…' : 'Confirmer'}
                  </button>
                </div>
              </div>
            )}

            <div className="detail-delete-zone">
              <button
                className="detail-btn detail-btn--delete"
                onClick={handleDelete}
                disabled={saving}
              >
                <TrashIcon size={14} />
                Supprimer définitivement
              </button>
            </div>
          </div>}

        </div>
      </div>
    </>
  );
}
