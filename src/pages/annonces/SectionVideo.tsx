import { useRef, useState } from 'react';
import { adminVideo } from '../../api/adminPhotos';
import { erreurFichierVideo, raisonEchecVideo, VIDEO_MAX_MO } from '../../utils/videoAnnonce';

type Props = {
  bienId: number;
  videoUrl: string | null;
  onChange: (url: string | null) => void;
  style?: React.CSSProperties;
};

/** Vidéo de l'annonce dans « Modifier l'annonce » : lecture, ajout/remplacement, retrait. */
export default function SectionVideo({ bienId, videoUrl, onChange, style }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  const [confirmRetrait, setConfirmRetrait] = useState(false);
  const [erreur, setErreur] = useState('');

  const avecRaison = (debut: string, err: unknown) => {
    const raison = raisonEchecVideo(err);
    return `${debut}${raison ? ` : ${raison}` : ''}.`;
  };

  async function choisir(f: File | undefined) {
    if (!f) return;
    const refus = erreurFichierVideo(f);
    if (refus) { setErreur(refus); return; }
    setErreur(''); setEnvoi(true);
    try {
      onChange((await adminVideo.upload(bienId, f)).video_url);
    } catch (err) {
      setErreur(avecRaison('Échec de l’envoi de la vidéo', err));
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    setErreur(''); setEnvoi(true);
    try {
      await adminVideo.remove(bienId);
      onChange(null);
      setConfirmRetrait(false);
    } catch (err) {
      setErreur(avecRaison('Impossible de retirer la vidéo', err));
    } finally {
      setEnvoi(false);
    }
  }

  const bouton: React.CSSProperties = { padding: '7px 14px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', color: 'var(--c-text)', fontSize: 12, fontWeight: 600, cursor: envoi ? 'not-allowed' : 'pointer', opacity: envoi ? 0.6 : 1 };

  return (
    <section style={style} aria-labelledby="titre-video">
      <h3 id="titre-video" style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: 'var(--c-text)' }}>Vidéo du bien</h3>
      <p style={{ fontSize: 11, color: 'var(--c-muted)', margin: '0 0 12px' }}>Une seule vidéo, MP4 uniquement, {VIDEO_MAX_MO} Mo au plus.</p>

      <input ref={input} type="file" accept="video/mp4" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; choisir(f); }} />

      {videoUrl ? (
        <video src={videoUrl} controls preload="metadata"
          style={{ display: 'block', width: '100%', maxHeight: 360, borderRadius: 8, background: '#000', marginBottom: 12 }} />
      ) : (
        <p style={{ fontSize: 13, color: 'var(--c-muted)', margin: '0 0 12px' }}>Aucune vidéo pour cette annonce.</p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={bouton} disabled={envoi} onClick={() => input.current?.click()}>
          {envoi ? 'Envoi en cours…' : videoUrl ? 'Remplacer la vidéo' : 'Ajouter une vidéo'}
        </button>
        {videoUrl && !confirmRetrait && (
          <button type="button" style={{ ...bouton, color: 'var(--s-red)' }} disabled={envoi} onClick={() => setConfirmRetrait(true)}>
            Retirer
          </button>
        )}
        {videoUrl && confirmRetrait && (
          <>
            <span style={{ fontSize: 12, color: 'var(--c-text)' }}>Retirer définitivement la vidéo ?</span>
            <button type="button" style={{ ...bouton, background: 'var(--s-red)', borderColor: 'var(--s-red)', color: '#fff' }} disabled={envoi} onClick={retirer}>Oui, retirer</button>
            <button type="button" style={bouton} disabled={envoi} onClick={() => setConfirmRetrait(false)}>Annuler</button>
          </>
        )}
      </div>

      {erreur && <p role="alert" style={{ fontSize: 12, color: 'var(--s-red)', margin: '10px 0 0' }}>{erreur}</p>}
    </section>
  );
}
