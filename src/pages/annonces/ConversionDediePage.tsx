import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { guesthouseApi, type GroupeEquipements } from '../../api/guesthouse';
import { salleFeteApi, type TypeEvenement } from '../../api/salleFete';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../shared/dialogues/useConfirm';
import { totauxGuesthouse, totauxSalle } from '../../shared/biens/calculsTarifs';
import { donneesPerduesConversion, sousTypeParCle } from '../../shared/biens/referentielTypes';
import * as G from '../../shared/biens/formulaires/guesthouse';
import * as S from '../../shared/biens/formulaires/salleFete';
import { apiMessage } from '../../utils/apiMessage';
import { estBienMasque } from '../../utils/statutBien';
import AvisBienMasque from '../../components/AvisBienMasque';
import EtapeTarifGuesthouse from '../commercial/guesthouse/EtapeTarif';
import EtapeReglesGuesthouse from '../commercial/guesthouse/EtapeRegles';
import EtapeTarifSalle from '../commercial/salle-fete/EtapeTarif';
import EtapeReglesSalle from '../commercial/salle-fete/EtapeRegles';
import { Libelle, Texte } from '../commercial/guesthouse/ui';
import { TotauxGuesthouseBloc, TotauxSalleBloc } from '../commercial/formulaire-dedie/BlocTotaux';

type Form = G.GuesthouseForm | S.SalleFeteForm;

/**
 * Lot 5 — conversion d'un bien vers une guesthouse ou une salle de fêtes (admin) : les détails
 * obligatoires du type cible se saisissent ici, puis POST /admin/biens/:id/convertir.
 */
export default function ConversionDediePage() {
  const { id, cle } = useParams();
  const numId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { confirmer } = useConfirm();
  const estGuesthouse = cle === 'guesthouse';
  const cible = sousTypeParCle(cle ?? '');
  const [bien, setBien] = useState<any>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [groupes, setGroupes] = useState<GroupeEquipements[] | null>(null);
  const [evenements, setEvenements] = useState<TypeEvenement[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [essai, setEssai] = useState(0);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let actif = true;
    getAdminBien.byId(numId)
      .then((b: any) => {
        if (!actif) return;
        setBien(b);
        const vide: Form = estGuesthouse ? G.formulaireVide(b.amenites?.proprietaire_info) : S.formulaireVide(b.amenites?.proprietaire_info);
        const { nom, description } = G.separerNomDescription(b.description);
        setForm({ ...vide, nom, description } as Form);
      })
      .catch(err => { if (actif) setErreur(apiMessage(err) ?? 'Bien introuvable.'); });
    return () => { actif = false; };
  }, [numId, estGuesthouse]);

  useEffect(() => {
    let actif = true;
    (estGuesthouse ? guesthouseApi.equipements() : salleFeteApi.equipements())
      .then(g => { if (actif) setGroupes(Array.isArray(g) ? g : []); })
      .catch(err => { if (actif) setErreur(apiMessage(err) ?? 'Impossible de charger les équipements.'); });
    if (!estGuesthouse) {
      salleFeteApi.evenements()
        .then(e => { if (actif) setEvenements(Array.isArray(e) ? e : []); })
        .catch(err => { if (actif) setErreur(apiMessage(err) ?? 'Impossible de charger les types d’événements.'); });
    }
    return () => { actif = false; };
  }, [estGuesthouse, essai]);

  const maj = (patch: Partial<Form>) => setForm(f => (f ? ({ ...f, ...patch } as Form) : f));
  const manques = useMemo(() => {
    if (!form) return [];
    const nom = form.nom.trim().length < 3 ? ['Nom (3 caractères au moins)'] : [];
    const etapes = estGuesthouse
      ? [2, 3].flatMap(i => G.manquesEtape(i, form as G.GuesthouseForm, G.PHOTOS_MIN))
      : [2, 3].flatMap(i => S.manquesEtape(i, form as S.SalleFeteForm, G.PHOTOS_MIN));
    return [...nom, ...etapes];
  }, [form, estGuesthouse]);

  if (!cible || cible.formulaire === 'classique') return <p style={{ padding: 24 }}>Type de conversion inconnu.</p>;
  if (erreur && !bien) return <p role="alert" style={{ padding: 24, color: 'var(--s-red)' }}>{erreur}</p>;
  if (!bien || !form) return <p style={{ padding: 24, color: 'var(--c-muted)' }}>Chargement…</p>;
  if (estBienMasque(bien)) return <div style={{ padding: 24 }}><AvisBienMasque statut={bien.statut} onRetour={() => navigate(-1)} /></div>;

  const totaux = estGuesthouse
    ? (() => { const f = form as G.GuesthouseForm; return <TotauxGuesthouseBloc t={totauxGuesthouse({ prixNuitee: f.prixNuitee, nuiteesMin: f.nuiteesMin, caution: f.caution, fraisMenage: f.fraisMenage, prixSemaine: f.prixSemaine, prixMois: f.prixMois })} />; })()
    : (() => { const f = form as S.SalleFeteForm; return <TotauxSalleBloc t={totauxSalle({ prix: f.prix, dureeHeures: f.dureeHeures, heuresMin: f.heuresMin, caution: f.caution, fraisMenage: f.fraisMenage, forfaitJournee: f.forfaitJournee, forfaitWeekend: f.forfaitWeekend })} />; })();

  const convertir = async () => {
    if (manques.length || enCours) return;
    const pertes = donneesPerduesConversion(bien, { cle: cible.cle, meuble: false });
    const ok = await confirmer({
      titre: `Convertir le bien n° ${numId} en ${cible.libelle.toLowerCase()} ?`,
      message: pertes.length
        ? <>Seront définitivement supprimés : <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{pertes.map(x => <li key={x}>{x}</li>)}</ul></>
        : 'Aucune donnée ne sera perdue.',
      confirmer: 'Convertir',
      danger: pertes.length > 0,
    });
    if (!ok) return;
    setEnCours(true);
    try {
      if (estGuesthouse) {
        const p = G.construirePayload(form as G.GuesthouseForm);
        await patchAdminBien.convertir(numId, { cle: 'guesthouse', description: G.descriptionPayload(form), details_guesthouse: p.details_guesthouse, equipements: p.equipements });
      } else {
        const p = S.construirePayload(form as S.SalleFeteForm);
        await patchAdminBien.convertir(numId, { cle: 'salle_fete', description: G.descriptionPayload(form), details_salle_fete: p.details_salle_fete, equipements: p.equipements, evenements: p.evenements });
      }
      // Le nom (1re ligne de la description) est écrit dans la même opération que la conversion.
      toast(`Bien converti en ${cible.libelle.toLowerCase()}. Vérifiez ses photos (${cible.photos_min} au minimum pour être publié).`, 'success');
      navigate(`/annonces/${numId}/modifier`, { replace: true });
    } catch (err) {
      setEnCours(false);
      toast(apiMessage(err) ?? 'La conversion a échoué : rien n’a été modifié.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 0' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Annuler</button>
        <h1 style={{ fontSize: 18, margin: 0, color: 'var(--c-text)' }}>Convertir le bien n° {numId} en {cible.libelle.toLowerCase()}</h1>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Libelle>{estGuesthouse ? 'Nom de la guesthouse' : 'Nom de la salle'}</Libelle>
          <Texte value={form.nom} onChange={v => maj({ nom: v })} maxLength={100} />
        </div>
        {estGuesthouse
          ? <>
              <EtapeTarifGuesthouse form={form as G.GuesthouseForm} maj={maj as (p: Partial<G.GuesthouseForm>) => void} totaux={totaux} />
              <EtapeReglesGuesthouse form={form as G.GuesthouseForm} maj={maj as (p: Partial<G.GuesthouseForm>) => void} groupes={groupes} erreur={erreur} reessayer={() => setEssai(n => n + 1)} />
            </>
          : <>
              <EtapeTarifSalle form={form as S.SalleFeteForm} maj={maj as (p: Partial<S.SalleFeteForm>) => void} totaux={totaux} />
              <EtapeReglesSalle form={form as S.SalleFeteForm} maj={maj as (p: Partial<S.SalleFeteForm>) => void} evenements={evenements} erreurEvenements={erreur}
                groupes={groupes} erreurEquipements={erreur} reessayer={() => setEssai(n => n + 1)} />
            </>}
      </div>
      <div style={{ position: 'sticky', bottom: 0, marginTop: 16, padding: '12px 0 16px', background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}>
        {manques.length > 0 && <p aria-live="polite" style={{ fontSize: 12, color: 'var(--s-red)', margin: '0 0 10px' }}>Il manque : {manques.join(' · ')}</p>}
        <button type="button" className="btn-submit" onClick={() => void convertir()} aria-disabled={manques.length > 0 || enCours}
          style={{ width: '100%', opacity: manques.length || enCours ? 0.5 : 1, cursor: manques.length || enCours ? 'not-allowed' : 'pointer' }}>
          {enCours ? 'Conversion…' : `Convertir en ${cible.libelle.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}
