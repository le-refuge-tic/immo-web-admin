import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { deleteAdminBien } from '../../api/deleteAdminBien';
import { ChevronLeftIcon, PinIcon, TrashIcon } from '../../components/Icons';

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

  const [bien, setBien]         = useState(null as any);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [action, setAction]     = useState(null as any);
  const [motif, setMotif]       = useState('');
  const [conditions, setConditions] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getAdminBien.byId(Number(id))
      .then(setBien)
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
      setAction(null);
      setMotif('');
      setConditions('');
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

          {/* Pièces */}
          {bien.pieces?.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Pièces ({bien.pieces.length})</div>
              <div className="detail-pieces-grid">
                {bien.pieces.map((piece: any) => (
                  <div className="detail-piece-card" key={piece.id}>
                    <div className="detail-piece-name">{piece.nom}</div>
                    <div className="detail-piece-surface">{Number(piece.surface).toLocaleString('fr-FR')} m²</div>
                    {piece.photos?.length > 0 && (
                      <div className="detail-piece-photo-count">{piece.photos.length} photo{piece.photos.length > 1 ? 's' : ''}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aménités */}
          {bien.amenites && Object.keys(bien.amenites).length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">Aménités &amp; équipements</div>
              <div className="detail-amenites-grid">
                {Object.entries(bien.amenites).map(([key, val]: any) => {
                  if (val === false || val === null || val === undefined || val === 0 || val === '') return null;
                  const label = key.replace(/_/g, ' ');
                  return (
                    <div className="detail-amenite-item" key={key}>
                      <span className="detail-amenite-dot" />
                      <span className="detail-amenite-label">
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                        {typeof val !== 'boolean' && val !== true && ` : ${val}`}
                      </span>
                    </div>
                  );
                })}
              </div>
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
                <strong>{formatPrice(bien.frais_visite)} FCFA</strong>
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
                {bien.localisation.quartier && (
                  <div className="detail-info-row">
                    <span>Quartier</span>
                    <strong>{bien.localisation.quartier}</strong>
                  </div>
                )}
                <div className="detail-info-row">
                  <span>GPS</span>
                  <strong>{Number(bien.localisation.latitude).toFixed(5)}, {Number(bien.localisation.longitude).toFixed(5)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Auteur */}
          {bien.user && (
            <div className="detail-card">
              <div className="detail-section-title">Auteur</div>
              <div className="detail-author-row">
                <div className="detail-author-avatar">
                  {bien.user.prenom?.[0]}{bien.user.nom?.[0]}
                </div>
                <div>
                  <div className="detail-author-name">{bien.user.prenom} {bien.user.nom}</div>
                  <div className="detail-author-email">{bien.user.email}</div>
                  <div className="detail-author-role">{ROLE_LABELS[bien.user.role] ?? bien.user.role}</div>
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
          <div className="detail-card detail-card--actions">
            <div className="detail-section-title">Actions de modération</div>

            {action === null ? (
              <div className="detail-action-btns">
                {mod !== 'approuve' && (
                  <button
                    className="detail-btn detail-btn--approve"
                    onClick={() => handleModerate('approuve')}
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
          </div>

        </div>
      </div>
    </>
  );
}
