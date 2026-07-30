import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminBien } from '../../api/getAdminBien';
import { patchAdminBien } from '../../api/patchAdminBien';
import { adminPhotos } from '../../api/adminPhotos';
import {
  ChevronLeftIcon, CheckIcon, TrashIcon,
  HomeIcon, PinIcon, GridIcon, CardIcon, ImageIcon,
} from '../../components/Icons';
import { BENIN_VILLES, getQuartiersForVille, getAllQuartiers } from '../../data/beninLocations';

// ── Icônes SVG locales ────────────────────────────────────────────────────────
const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const StarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Mapping types ─────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
  { label: 'Chambre-Salon',     type: 'appart_vide',   sousType: 'chambre_salon'       },
  { label: 'Entrée-Coucher',    type: 'appart_vide',   sousType: 'entree_coucher'      },
  { label: 'Appartement',       type: 'appart_vide',   sousType: 'appartement'         },
  { label: 'Appart. meublé',    type: 'appart_meuble', sousType: 'appartement'         },
  { label: 'Villa',             type: 'maison',        sousType: 'villa'               },
  { label: 'Maison',            type: 'maison',        sousType: 'maison_individuelle' },
  { label: 'Boutique / Local',  type: 'appart_vide',   sousType: 'boutique'            },
  { label: 'Terrain',           type: 'terrain',       sousType: 'terrain'             },
  { label: 'Guesthouse',        type: 'guesthouse',    sousType: ''                    },
] as const;

function getTypeLabel(dbType: string, dbSousType: string) {
  return TYPE_OPTIONS.find(
    o => o.type === dbType && (o.sousType === dbSousType || (!dbSousType && !o.sousType))
  )?.label ?? '';
}

// ── Options constantes ────────────────────────────────────────────────────────
const FINITIONS = [
  { value: 'ordinaire',     label: 'Ordinaire',           sub: 'Finitions simples, fonctionnelles' },
  { value: 'semi_staffe',   label: 'Semi-Staffé',         sub: 'Salon staffé et carrelé, chambre simple' },
  { value: 'staffe_carele', label: 'Staffé-Carrelé',      sub: 'Staff complet + carreaux modernes partout' },
  { value: 'haut_standing', label: 'Haut Standing / VIP', sub: 'Baies vitrées, douche moderne, climatisation' },
];
const ELEC_OPTS   = [{ value:'non', label:'Aucune' }, { value:'sbee', label:'SBEE (compteur commun)' }, { value:'decompteur', label:'Décompteur (séparé)' }];
const EAU_OPTS    = [{ value:'non', label:'Aucune' }, { value:'soneb', label:'SONEB' }, { value:'forage', label:'Forage' }];
const CUISINE_OPTS= [{ value:'ouverte', label:'Ouverte / Américaine' }, { value:'fermee', label:'Fermée' }, { value:'kitchenette', label:'Kitchenette' }, { value:'aucune', label:'Aucune' }];
const BOYERIE_OPTS= [{ value:'simple', label:'Simple' }, { value:'douche', label:'Avec douche' }];
const DISPO_OPTS  = [{ value:'immediate', label:'Disponible maintenant' }, { value:'en_finition', label:'En finition — bientôt dispo' }];
const VOISINAGE_PRESET  = ['École','Marché','Mosquée','Église','Pharmacie','Hôpital','Banque','Supermarché','Restaurant','Transport commun','Route bitumée','Calme','Sécurisé'];
const EQUIPEMENT_PRESET = ['Climatisation','Ventilateur','Chauffe-eau','Réfrigérateur','Télévision','Wi-Fi','Groupe électrogène','Balcon','Terrasse','Jardin','Piscine','Gardien'];

// ── Composants UI ─────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize:11, fontWeight:700, letterSpacing:'.7px', textTransform:'uppercase', color:'#2563EB', margin:'0 0 18px', paddingBottom:8, borderBottom:'1.5px solid #E2E8F0' }}>{children}</h3>;
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'.5px', marginBottom: hint ? 4 : 7 }}>{label}</label>
      {hint && <p style={{ fontSize:11, color:'#64748B', margin:'0 0 7px', fontStyle:'italic' }}>{hint}</p>}
      {children}
    </div>
  );
}
function SInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [f, setF] = useState(false);
  return <input {...props} style={{ width:'100%', boxSizing:'border-box', background:'#fff', border:`1.5px solid ${f ? '#2563EB' : '#E2E8F0'}`, borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0F172A', outline:'none', transition:'border-color .15s', ...props.style }}
    onFocus={e => { setF(true); props.onFocus?.(e); }} onBlur={e => { setF(false); props.onBlur?.(e); }} />;
}
function SSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width:'100%', boxSizing:'border-box', background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:8, padding:'9px 36px 9px 12px', fontSize:13, color:'#0F172A', appearance:'none', WebkitAppearance:'none', cursor:'pointer', outline:'none' }}>
        {children}
      </select>
      <svg style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'#64748B' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} style={{ padding:'6px 14px', borderRadius:20, fontSize:12, border: active ? '2px solid #2563EB' : '1.5px solid #E2E8F0', background: active ? '#EFF6FF' : '#fff', color: active ? '#2563EB' : '#64748B', fontWeight: active ? 600 : 400, cursor:'pointer', transition:'all .12s' }}>{label}</button>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean | null | undefined; onChange: (v: boolean | null) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #E2E8F0' }}>
      <span style={{ fontSize:13, color:'#0F172A' }}>{label}</span>
      <div style={{ display:'flex', gap:4 }}>
        {([true, false] as const).map(v => (
          <button key={String(v)} type="button" onClick={() => onChange(value === v ? null : v)} style={{ padding:'4px 16px', borderRadius:6, fontSize:12, cursor:'pointer', border: value===v ? '2px solid #2563EB' : '1.5px solid #E2E8F0', background: value===v ? '#EFF6FF' : '#fff', color: value===v ? '#2563EB' : '#64748B', fontWeight: value===v ? 600 : 400, transition:'all .12s' }}>{v ? 'Oui' : 'Non'}</button>
        ))}
      </div>
    </div>
  );
}
function TagPicker({ label, preset, value, onChange }: { label: string; preset: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState('');
  const toggle = (t: string) => onChange(value.includes(t) ? value.filter(x => x !== t) : [...value, t]);
  const add = () => { const t = custom.trim(); if (t && !value.includes(t)) { onChange([...value, t]); setCustom(''); } };
  return (
    <Field label={label}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
        {preset.map(t => <Chip key={t} label={t} active={value.includes(t)} onClick={() => toggle(t)} />)}
        {value.filter(t => !preset.includes(t)).map(t => <button key={t} type="button" onClick={() => toggle(t)} style={{ padding:'6px 12px', borderRadius:20, fontSize:12, cursor:'pointer', border:'2px solid #2563EB', background:'#EFF6FF', color:'#2563EB', fontWeight:600 }}>{t} ×</button>)}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <SInput placeholder="Ajouter un autre…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button type="button" onClick={add} style={{ padding:'0 16px', background:'#2563EB', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer', fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>+ Ajouter</button>
      </div>
    </Field>
  );
}

// ── Onglets / navigation ──────────────────────────────────────────────────────
const TABS = ['Type & Prix', 'Localisation', 'Confort', 'Honoraires', 'Photos'] as const;
type Tab = typeof TABS[number];
type PieceState = { id: number; nom: string; surface: string; longueur: string; largeur: string };
type PhotoState = { id: number; url: string; is_cover: boolean; piece_id: number | null; uploading?: boolean };

function NavIcon({ tab }: { tab: Tab }) {
  if (tab === 'Type & Prix')   return <HomeIcon size={14} />;
  if (tab === 'Localisation')  return <PinIcon size={14} />;
  if (tab === 'Confort')       return <GridIcon />;
  if (tab === 'Honoraires')    return <CardIcon size={14} />;
  return <ImageIcon size={14} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnnonceEditPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const numId    = Number(id);

  const [bien, setBien]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('Type & Prix');

  // Localisation
  const [ville, setVille]               = useState('');
  const [autreVille, setAutreVille]     = useState('');
  const [selQ, setSelQ]                 = useState('');
  const [autreQ, setAutreQ]             = useState('');
  const [qSearch, setQSearch]           = useState('');
  const [qOpen, setQOpen]               = useState(false);
  const [adresse, setAdresse]           = useState('');
  const qRef = useRef<HTMLDivElement>(null);

  // Type & Prix
  const [typeLabel, setTypeLabel]     = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix]               = useState('');
  const [superficie, setSuperficie]   = useState('');
  const [cloture, setCloture]         = useState<boolean | null>(null);
  const [entreePerso, setEntreePerso] = useState<boolean | null>(null);

  // Pièces
  const [pieces, setPieces] = useState<PieceState[]>([]);

  // Caractéristiques
  const [sanitaire, setSanitaire]       = useState<boolean | null>(null);
  const [couloir, setCouloir]           = useState<boolean | null>(null);
  const [finition, setFinition]         = useState('');
  const [typeCuisine, setTypeCuisine]   = useState('');
  const [cour, setCour]                 = useState<boolean | null>(null);
  const [typeCour, setTypeCour]         = useState('');
  const [arriereCour, setArriereCour]   = useState<boolean | null>(null);
  const [boyerie, setBoyerie]           = useState<boolean | null>(null);
  const [boyerieType, setBoyerieType]   = useState('');
  const [parking, setParking]           = useState<boolean | null>(null);
  const [parkingCap, setParkingCap]     = useState('');
  const [accesVeh, setAccesVeh]         = useState<boolean | null>(null);
  const [nbVeh, setNbVeh]               = useState('');
  const [armoiresCh, setArmoiresCh]     = useState<boolean | null>(null);
  const [nbVoisins, setNbVoisins]       = useState('');

  // Réseaux
  const [elec, setElec]             = useState('non');
  const [prixKwh, setPrixKwh]       = useState('');
  const [eau, setEau]               = useState('non');
  const [sonebG, setSonebG]         = useState('');
  const [prixM3, setPrixM3]         = useState('');
  const [forageP, setForageP]       = useState<boolean | null>(null);
  const [prixForage, setPrixForage] = useState('');
  const [dispo, setDispo]           = useState('immediate');
  const [voisinage, setVoisinage]   = useState<string[]>([]);
  const [equips, setEquips]         = useState<string[]>([]);

  // Photos
  const [photos, setPhotos] = useState<PhotoState[]>([]);

  // Autres (options personnalisées)
  const [autrePrecision, setAutrePrecision] = useState<Record<string, string>>({});

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getAdminBien.byId(numId)
      .then(b => {
        setBien(b);
        const a = b.amenites ?? {}, loc = b.localisation ?? {};

        const v = loc.ville ?? '';
        if (BENIN_VILLES.includes(v)) setVille(v); else if (v) { setVille('autre'); setAutreVille(v); }

        const q = loc.quartier ?? '';
        if (getAllQuartiers().includes(q)) setSelQ(q); else if (q) { setSelQ('autre'); setAutreQ(q); }
        setAdresse(loc.adresse ?? '');

        setTypeLabel(getTypeLabel(b.type ?? '', a.sous_type ?? ''));
        setDescription(b.description ?? '');
        setPrix(b.prix != null ? String(b.prix) : '');

        if (b.details_maison)  { const s = Number(b.details_maison.superficie);  if (s > 0) setSuperficie(String(s)); setCloture(b.details_maison.cloture ?? null); }
        if (b.details_terrain) { const s = Number(b.details_terrain.superficie); if (s > 0) setSuperficie(String(s)); setCloture(b.details_terrain.cloture ?? null); }
        if (b.details_appart)  setEntreePerso(b.details_appart.entree_personnelle ?? null);

        setPieces((b.pieces ?? []).map((p: any) => ({ id:p.id, nom:p.nom??'', surface:'', longueur:'', largeur:'' })));

        setSanitaire(a.sanitaire??null); setCouloir(a.chambre_couloir??null);
        setCour(a.cour??null); setArriereCour(a.arriere_cour??null);
        setBoyerie(a.boyerie??null);
        setParking(a.parking??null); setParkingCap(a.parking_capacite!=null?String(a.parking_capacite):'');
        setAccesVeh(a.acces_vehicule??null); setNbVeh(a.nb_vehicules!=null?String(a.nb_vehicules):'');
        setArmoiresCh(a.armoires_chambre??null); setNbVoisins(a.nb_voisins!=null?String(a.nb_voisins):'');

        const autreMap: Record<string, string> = {};
        const setChip = (
          setter: (v: string) => void, raw: string | undefined,
          known: string[], field: string,
        ) => {
          if (!raw) { setter(''); return; }
          if (known.includes(raw)) { setter(raw); }
          else { setter('autre'); autreMap[field] = raw; }
        };
        setChip(setFinition,    a.finition,       FINITIONS.map(f=>f.value), 'finition');
        setChip(setTypeCuisine, a.type_cuisine,   CUISINE_OPTS.map(o=>o.value), 'cuisine');
        setChip(setTypeCour,    a.type_cour,      ['commune','privee'], 'type_cour');
        setChip(setBoyerieType, a.boyerie_type,   BOYERIE_OPTS.map(o=>o.value), 'boyerie_type');
        setChip(setElec,        a.electricite,    ELEC_OPTS.map(o=>o.value), 'elec');
        setChip(setEau,         a.eau,            EAU_OPTS.map(o=>o.value), 'eau');
        setChip(setSonebG,      a.soneb_gestion,  ['voisins','prix_m3'], 'soneb_gestion');
        setChip(setDispo,       a.disponibilite,  DISPO_OPTS.map(o=>o.value), 'dispo');
        setAutrePrecision(autreMap);

        setPrixKwh(a.prix_kwh!=null?String(a.prix_kwh):'');
        setPrixM3(a.prix_m3!=null?String(a.prix_m3):'');
        setForageP(a.forage_payant??null); setPrixForage(a.prix_forage!=null?String(a.prix_forage):'');
        setVoisinage(a.voisinage??[]); setEquips(a.equipements??[]);
        setPhotos(b.photos??[]);
      })
      .catch(() => setError('Impossible de charger ce bien.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (qRef.current && !qRef.current.contains(e.target as Node)) setQOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true); setSaved(false); setError('');
    try {
      const opt = TYPE_OPTIONS.find(o => o.label === typeLabel);
      const dbType = opt?.type ?? bien?.type ?? '', dbST = opt?.sousType ?? '';
      const villeVal    = ville  === 'autre' ? autreVille.trim() : ville;
      const quartierVal = selQ   === 'autre' ? autreQ.trim()     : selQ;

      const ame: Record<string,any> = {};
      // null = "non précisé" → envoyé au backend pour effacer la valeur précédente
      const sa = (k: string, v: any) => { if (v !== undefined) ame[k] = v === '' ? null : v; };
      const chip = (k: string, v: string, field: string) => {
        if (!v) { ame[k] = null; return; }
        sa(k, v === 'autre' ? (autrePrecision[field] || 'autre') : v);
      };
      if (dbST) sa('sous_type', dbST);
      sa('sanitaire', sanitaire); sa('chambre_couloir', couloir);
      chip('finition', finition, 'finition');
      chip('type_cuisine', typeCuisine, 'cuisine');
      sa('cour', cour);
      if (cour) {
        chip('type_cour', typeCour, 'type_cour');
        if (typeCour === 'commune' && nbVoisins) sa('nb_voisins', Number(nbVoisins));
      } else {
        ame['nb_voisins'] = null;
      }
      sa('arriere_cour', arriereCour); sa('boyerie', boyerie);
      if (boyerie) chip('boyerie_type', boyerieType, 'boyerie_type');
      sa('parking', parking); if (parking && parkingCap) sa('parking_capacite', Number(parkingCap));
      sa('acces_vehicule', accesVeh); if (accesVeh && nbVeh) sa('nb_vehicules', Number(nbVeh));
      sa('armoires_chambre', armoiresCh);
      const elecVal = elec === 'autre' ? (autrePrecision.elec || 'autre') : elec;
      sa('electricite', elecVal);
      if (elec==='decompteur' && prixKwh) sa('prix_kwh', Number(prixKwh));
      const eauVal = eau === 'autre' ? (autrePrecision.eau || 'autre') : eau;
      sa('eau', eauVal);
      if (eau==='soneb') {
        const sg = sonebG === 'autre' ? (autrePrecision.soneb_gestion || 'autre') : sonebG;
        if (sg) { sa('soneb_gestion', sg); if (sonebG==='prix_m3' && prixM3) sa('prix_m3', Number(prixM3)); }
      }
      if (eau==='forage') { sa('forage_payant', forageP); if (forageP && prixForage) sa('prix_forage', Number(prixForage)); }
      const dispoVal = dispo === 'autre' ? (autrePrecision.dispo || 'autre') : dispo;
      sa('disponibilite', dispoVal);
      if (voisinage.length) sa('voisinage', voisinage); if (equips.length) sa('equipements', equips);

      const payload: any = {
        type: dbType, description: description||undefined, prix: prix ? Number(prix) : undefined,
        localisation: { ville:villeVal, quartier:quartierVal||undefined, adresse:adresse||undefined },
        amenites: ame,
        pieces: pieces.map(p => ({ id:p.id, nom:p.nom, surface:p.surface!==''?Number(p.surface):null, longueur:p.longueur!==''?Number(p.longueur):null, largeur:p.largeur!==''?Number(p.largeur):null })),
      };
      if      (dbType==='maison')                              payload.details_maison  = { superficie:superficie?Number(superficie):0, cloture:cloture??false };
      else if (dbType==='terrain')                             payload.details_terrain = { superficie:superficie?Number(superficie):0, cloture:cloture??false };
      else if (dbType==='appart_vide'||dbType==='appart_meuble') payload.details_appart  = { entree_personnelle:entreePerso??false };

      await patchAdminBien.update(numId, payload);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  }

  // ── Photos ──────────────────────────────────────────────────────────────────
  async function handleUpload(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const tempId = -(Date.now() + Math.random());
      setPhotos(prev => [...prev, { id:tempId as any, url:URL.createObjectURL(file), is_cover:false, piece_id:null, uploading:true }]);
      try {
        const sv = await adminPhotos.upload(numId, file);
        setPhotos(prev => prev.map(p => (p.id as any)===tempId ? { ...sv, uploading:false } : p));
      } catch { setPhotos(prev => prev.filter(p => (p.id as any)!==tempId)); setError('Échec upload'); }
    }
  }
  async function handleDelete(photoId: number) {
    if (!window.confirm('Supprimer cette photo ?')) return;
    await adminPhotos.remove(numId, photoId);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }
  async function handleCover(photoId: number) {
    await adminPhotos.setCover(numId, photoId);
    setPhotos(prev => prev.map(p => ({ ...p, is_cover: p.id === photoId })));
  }

  // ── Dérivés ──────────────────────────────────────────────────────────────────
  const opt = TYPE_OPTIONS.find(o => o.label === typeLabel);
  const dbType = opt?.type ?? bien?.type ?? '';
  const dbST   = opt?.sousType ?? '';
  const isMaison  = dbType === 'maison';
  const isTerrain = dbType === 'terrain';
  const isAppart  = dbType === 'appart_vide' || dbType === 'appart_meuble';
  const isSmall   = dbST === 'chambre_salon' || dbST === 'entree_coucher';
  const villeForQ = ville === 'autre' ? '' : ville;
  const qList     = villeForQ ? getQuartiersForVille(villeForQ) : getAllQuartiers();
  const filteredQ = qSearch.trim() ? qList.filter(q => q.toLowerCase().includes(qSearch.toLowerCase())) : qList;
  const amenites  = bien?.amenites ?? {};
  const isOwner   = bien?.user?.role === 'proprietaire';
  const CARD: React.CSSProperties = { background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'22px 24px', marginBottom:18 };

  // ── Loading / error states ───────────────────────────────────────────────────
  const TOP_STYLE: React.CSSProperties = {
    position:'sticky', top:0, zIndex:40,
    display:'flex', alignItems:'center', gap:10, padding:'0 24px', height:52,
    borderBottom:'1px solid #E2E8F0', background:'#fff', boxShadow:'0 1px 0 #E2E8F0',
  };

  if (loading) return (
    <>
      <div style={TOP_STYLE}><button onClick={() => navigate(`/annonces/${id}`)} style={{ background:'none',border:'none',cursor:'pointer',color:'#64748B',fontSize:12,display:'flex',alignItems:'center',gap:5 }}><ChevronLeftIcon size={13}/> Retour</button></div>
      <div style={{ display:'flex',justifyContent:'center',alignItems:'center',height:'45vh',color:'#64748B' }}>Chargement…</div>
    </>
  );
  if (!bien) return (
    <>
      <div style={TOP_STYLE}><button onClick={() => navigate(-1)} style={{ background:'none',border:'none',cursor:'pointer',color:'#64748B',fontSize:12,display:'flex',alignItems:'center',gap:5 }}><ChevronLeftIcon size={13}/> Retour</button></div>
      <div style={{ padding:32,color:'#EF4444' }}>{error || 'Bien introuvable'}</div>
    </>
  );

  return (
    <>
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={TOP_STYLE}>
        <button onClick={() => navigate(`/annonces/${id}`)} style={{ display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',color:'#64748B',fontSize:12,padding:'5px 8px',borderRadius:6,fontWeight:500,flexShrink:0 }}>
          <ChevronLeftIcon size={13}/> Retour
        </button>
        <div style={{ width:1,height:16,background:'#E2E8F0',flexShrink:0 }}/>
        <span style={{ fontSize:12,fontWeight:600,color:'#0F172A',flexShrink:0 }}>Bien #{id}</span>
        <div style={{ flex:1 }}/>
        {error && <span style={{ fontSize:11,color:'#EF4444',flexShrink:0,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{error}</span>}
        <button
          onClick={handleSave} disabled={saving}
          style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0,background:saved?'#16A34A':'#2563EB',color:'#fff',border:'none',borderRadius:8,padding:'10px 22px',fontSize:13,fontWeight:600,cursor:saving?'not-allowed':'pointer',opacity:saving?.7:1,transition:'background .2s',whiteSpace:'nowrap' }}
        >
          {saved ? <CheckIcon size={13}/> : <SaveIcon/>}
          {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>

      {/* ── Corps : nav gauche + contenu ───────────────────────────────────── */}
      <div style={{ display:'flex', gap:0, alignItems:'flex-start' }}>

        {/* Navigation latérale */}
        <nav style={{ width:220, flexShrink:0, borderRight:'1px solid #E2E8F0', background:'#fff', padding:'16px 0', position:'sticky', top:52, alignSelf:'flex-start', maxHeight:'calc(100vh - 52px)', overflowY:'auto' }}>
          {TABS.map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display:'flex', alignItems:'center', gap:10, width:'100%', padding:'11px 20px',
                  fontSize:13, fontWeight: active ? 700 : 400, cursor:'pointer', textAlign:'left',
                  background: active ? '#EFF6FF' : 'transparent',
                  color: active ? '#2563EB' : '#64748B',
                  border:'none',
                  borderLeft: `3px solid ${active ? '#2563EB' : 'transparent'}`,
                  transition:'all .12s',
                }}
              >
                <span style={{ flexShrink:0, color: active ? '#2563EB' : '#94A3B8' }}><NavIcon tab={tab}/></span>
                <span>{tab}</span>
                {tab === 'Photos' && photos.length > 0 && (
                  <span style={{ marginLeft:'auto', fontSize:10, background: active?'#2563EB':'#E2E8F0', color: active?'#fff':'#64748B', padding:'1px 7px', borderRadius:10, fontWeight:700 }}>{photos.length}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Contenu de la section active */}
        <div style={{ flex:1, padding:'24px 28px', minWidth:0 }}>

          {/* ═══ TYPE & PRIX ═══ */}
          {activeTab === 'Type & Prix' && (
            <>
              <div style={CARD}>
                <SectionTitle>Type de bien</SectionTitle>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {TYPE_OPTIONS.map(o => {
                    const active = typeLabel === o.label;
                    return <button key={o.label} type="button" onClick={() => setTypeLabel(o.label)} style={{ padding:'10px 8px', borderRadius:8, fontSize:12.5, fontWeight:active?700:400, cursor:'pointer', textAlign:'center', border:active?'2px solid #2563EB':'1.5px solid #E2E8F0', background:active?'#EFF6FF':'#fff', color:active?'#1D4ED8':'#64748B', boxShadow:active?'0 0 0 3px rgba(37,99,235,.1)':'none', transition:'all .12s' }}>{o.label}</button>;
                  })}
                </div>
              </div>

              <div style={CARD}>
                <SectionTitle>Prix & Description</SectionTitle>
                <Field label="Loyer mensuel (FCFA)" hint="Modifiable après vérification sur site.">
                  <SInput type="number" min="0" step="500" placeholder="Ex : 50 000" value={prix} onChange={e => setPrix(e.target.value)} />
                </Field>
                <Field label="Description">
                  <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description détaillée du bien…" style={{ width:'100%', boxSizing:'border-box', background:'#fff', border:'1.5px solid #E2E8F0', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#0F172A', resize:'vertical', fontFamily:'inherit', outline:'none' }}/>
                </Field>
              </div>

              {(isMaison || isTerrain) && (
                <div style={CARD}>
                  <SectionTitle>Terrain / Bâti</SectionTitle>
                  <Field label="Superficie totale (m²)"><SInput type="number" min="0" placeholder="Ex : 200" value={superficie} onChange={e => setSuperficie(e.target.value)} /></Field>
                  <Toggle label="Terrain / maison clôturé(e)" value={cloture} onChange={setCloture} />
                </div>
              )}
              {isAppart && (
                <div style={CARD}>
                  <SectionTitle>Accès</SectionTitle>
                  <Toggle label="Entrée personnelle (portail ou porte dédiée)" value={entreePerso} onChange={setEntreePerso} />
                </div>
              )}
            </>
          )}

          {/* ═══ LOCALISATION ═══ */}
          {activeTab === 'Localisation' && (
            <div style={CARD}>
              <SectionTitle>Localisation du bien</SectionTitle>
              <Field label="Ville">
                <SSelect value={ville} onChange={v => { setVille(v); setSelQ(''); setQSearch(''); }}>
                  <option value="">— Sélectionner —</option>
                  {BENIN_VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                  <option value="autre">Autre ville (saisir)</option>
                </SSelect>
                {ville === 'autre' && <SInput style={{ marginTop:8 }} placeholder="Nom de la ville…" value={autreVille} onChange={e => setAutreVille(e.target.value)} />}
              </Field>

              <Field label="Quartier" hint={villeForQ ? `${qList.length} quartiers dans ${villeForQ} — tapez pour filtrer` : 'Choisissez une ville pour filtrer les quartiers'}>
                <div ref={qRef} style={{ position:'relative' }}>
                  <SInput
                    placeholder="Taper pour rechercher…"
                    value={qOpen ? qSearch : (selQ === 'autre' ? autreQ : selQ)}
                    onFocus={() => { setQSearch(''); setQOpen(true); }}
                    onChange={e => { setQSearch(e.target.value); setQOpen(true); }}
                  />
                  {qOpen && (
                    <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'2px solid #2563EB', borderRadius:8, maxHeight:240, overflowY:'auto', zIndex:100, boxShadow:'0 8px 24px rgba(0,0,0,.12)' }}>
                      {filteredQ.length === 0 && <div style={{ padding:'10px 12px', fontSize:12, color:'#64748B' }}>Aucun résultat pour "{qSearch}"</div>}
                      {filteredQ.slice(0, 80).map(q => (
                        <div key={q} onMouseDown={() => { setSelQ(q); setQOpen(false); setQSearch(''); }}
                          style={{ padding:'8px 12px', fontSize:13, cursor:'pointer', color:'#0F172A', background: selQ===q?'#EFF6FF':'transparent', fontWeight: selQ===q?600:400 }}
                          onMouseEnter={e => e.currentTarget.style.background='#F1F5F9'}
                          onMouseLeave={e => e.currentTarget.style.background = selQ===q?'#EFF6FF':'transparent'}
                        >{q}</div>
                      ))}
                      {filteredQ.length > 80 && <div style={{ padding:'6px 12px', fontSize:11, color:'#64748B', borderTop:'1px solid #E2E8F0', fontStyle:'italic' }}>…{filteredQ.length - 80} autres — affinez la recherche</div>}
                      <div onMouseDown={() => { setSelQ('autre'); setQOpen(false); setQSearch(''); }}
                        style={{ padding:'9px 12px', fontSize:12.5, cursor:'pointer', color:'#2563EB', fontWeight:600, borderTop:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:16, lineHeight:1 }}>+</span> Autre quartier (saisir manuellement)
                      </div>
                    </div>
                  )}
                </div>
                {selQ === 'autre' && <SInput style={{ marginTop:8 }} placeholder="Nom du quartier…" value={autreQ} onChange={e => setAutreQ(e.target.value)} />}
              </Field>

              <Field label="Adresse précise">
                <SInput placeholder="Ex : Rue des Manguiers, lot 12, en face de la pharmacie…" value={adresse} onChange={e => setAdresse(e.target.value)} />
              </Field>
            </div>
          )}

          {/* ═══ CONFORT ═══ */}
          {activeTab === 'Confort' && (
            <>
              {pieces.length > 0 && (
                <div style={CARD}>
                  <SectionTitle>Composition des pièces</SectionTitle>
                  <p style={{ fontSize:12, color:'#64748B', margin:'0 0 16px', lineHeight:1.5 }}>Remplissez les dimensions après vérification sur site. Superficie en m², longueur / largeur en mètres. Laissez vide ce qui n'a pas été mesuré.</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {pieces.map((p, i) => (
                      <div key={p.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:10, padding:14, background:'#F8FAFC', borderRadius:8, border:'1px solid #E2E8F0' }}>
                        <div><label style={{ fontSize:11, fontWeight:600, color:'#64748B', display:'block', marginBottom:5 }}>Pièce</label><SInput value={p.nom} onChange={e => setPieces(ps => ps.map((x,j) => j===i?{...x,nom:e.target.value}:x))} /></div>
                        <div><label style={{ fontSize:11, fontWeight:600, color:'#64748B', display:'block', marginBottom:5 }}>Superficie (m²)</label><SInput type="number" min="0" step="0.5" placeholder="—" value={p.surface} onChange={e => setPieces(ps => ps.map((x,j) => j===i?{...x,surface:e.target.value}:x))} /></div>
                        <div><label style={{ fontSize:11, fontWeight:600, color:'#64748B', display:'block', marginBottom:5 }}>Longueur (m)</label><SInput type="number" min="0" step="0.1" placeholder="Optionnel" value={p.longueur} onChange={e => setPieces(ps => ps.map((x,j) => j===i?{...x,longueur:e.target.value}:x))} /></div>
                        <div><label style={{ fontSize:11, fontWeight:600, color:'#64748B', display:'block', marginBottom:5 }}>Largeur (m)</label><SInput type="number" min="0" step="0.1" placeholder="Optionnel" value={p.largeur} onChange={e => setPieces(ps => ps.map((x,j) => j===i?{...x,largeur:e.target.value}:x))} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={CARD}>
                <SectionTitle>Caractéristiques</SectionTitle>
                <Toggle label="Sanitaire" value={sanitaire} onChange={setSanitaire} />
                {isSmall && <Toggle label="Maison à couloir" value={couloir} onChange={setCouloir} />}
                <Toggle label="Cour" value={cour} onChange={setCour} />
                {cour && (
                  <div style={{ paddingLeft:16, paddingTop:8, paddingBottom:4 }}>
                    <Field label="Type de cour">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        <Chip label="Commune" active={typeCour==='commune'} onClick={() => setTypeCour(typeCour==='commune'?'':'commune')} />
                        <Chip label="Privée"  active={typeCour==='privee'}  onClick={() => setTypeCour(typeCour==='privee'?'':'privee')} />
                        <Chip label="Autre (à préciser)" active={typeCour==='autre'} onClick={() => setTypeCour(typeCour==='autre'?'':'autre')} />
                      </div>
                      {typeCour==='autre' && <SInput style={{ marginTop:8 }} placeholder="Précisez le type de cour…" value={autrePrecision.type_cour??''} onChange={e => setAutrePrecision(p=>({...p, type_cour:e.target.value}))} />}
                    </Field>
                    {typeCour==='commune' && (
                      <Field label="Nb de ménages dans la concession">
                        <SInput type="number" min="0" placeholder="Ex : 4" value={nbVoisins} onChange={e => setNbVoisins(e.target.value)} />
                      </Field>
                    )}
                    <Toggle label="Arrière-cour" value={arriereCour} onChange={setArriereCour} />
                  </div>
                )}
                <Toggle label="Boyerie (chambre domestique)" value={boyerie} onChange={setBoyerie} />
                {boyerie && (
                  <div style={{ paddingLeft:16, paddingTop:8, paddingBottom:4 }}>
                    <Field label="Type de boyerie">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {BOYERIE_OPTS.map(o => <Chip key={o.value} label={o.label} active={boyerieType===o.value} onClick={() => setBoyerieType(boyerieType===o.value?'':o.value)} />)}
                        <Chip label="Autre (à préciser)" active={boyerieType==='autre'} onClick={() => setBoyerieType(boyerieType==='autre'?'':'autre')} />
                      </div>
                      {boyerieType==='autre' && <SInput style={{ marginTop:8 }} placeholder="Précisez…" value={autrePrecision.boyerie_type??''} onChange={e => setAutrePrecision(p=>({...p, boyerie_type:e.target.value}))} />}
                    </Field>
                  </div>
                )}
                <Toggle label="Parking" value={parking} onChange={setParking} />
                {parking && <div style={{ paddingLeft:16, paddingTop:8, paddingBottom:4 }}><Field label="Capacité (nb véhicules)"><SInput type="number" min="1" placeholder="Ex : 2" value={parkingCap} onChange={e => setParkingCap(e.target.value)} /></Field></div>}
                <Toggle label="Accès véhicule (portail suffisamment large)" value={accesVeh} onChange={setAccesVeh} />
                {accesVeh && <div style={{ paddingLeft:16, paddingTop:8, paddingBottom:4 }}><Field label="Nb de véhicules pouvant entrer"><SInput type="number" min="1" placeholder="Ex : 1" value={nbVeh} onChange={e => setNbVeh(e.target.value)} /></Field></div>}
                {isSmall && <Toggle label="Armoires encastrées dans la chambre" value={armoiresCh} onChange={setArmoiresCh} />}
              </div>

              <div style={CARD}>
                <SectionTitle>Finition</SectionTitle>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {FINITIONS.map(o => {
                    const active = finition === o.value;
                    return <button key={o.value} type="button" onClick={() => setFinition(active?'':o.value)} style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'11px 14px', borderRadius:8, cursor:'pointer', textAlign:'left', width:'100%', border:active?'2px solid #2563EB':'1.5px solid #E2E8F0', background:active?'#EFF6FF':'#fff', transition:'all .12s' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:active?'#1D4ED8':'#0F172A' }}>{o.label}</span>
                      <span style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{o.sub}</span>
                    </button>;
                  })}
                  {(() => { const active = finition==='autre'; return (
                    <button type="button" onClick={() => setFinition(active?'':'autre')} style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', padding:'11px 14px', borderRadius:8, cursor:'pointer', textAlign:'left', width:'100%', border:active?'2px solid #2563EB':'1.5px solid #E2E8F0', background:active?'#EFF6FF':'#fff', transition:'all .12s' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:active?'#1D4ED8':'#0F172A' }}>Autre (à préciser)</span>
                      {active && <SInput style={{ marginTop:8 }} placeholder="Décrivez la finition…" value={autrePrecision.finition??''} onChange={e => setAutrePrecision(p=>({...p, finition:e.target.value}))} onClick={ev => ev.stopPropagation()} />}
                    </button>
                  ); })()}
                </div>
              </div>

              {!isSmall && (
                <div style={CARD}>
                  <SectionTitle>Cuisine</SectionTitle>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {CUISINE_OPTS.map(o => <Chip key={o.value} label={o.label} active={typeCuisine===o.value} onClick={() => setTypeCuisine(typeCuisine===o.value?'':o.value)} />)}
                    <Chip label="Autre (à préciser)" active={typeCuisine==='autre'} onClick={() => setTypeCuisine(typeCuisine==='autre'?'':'autre')} />
                  </div>
                  {typeCuisine==='autre' && <SInput style={{ marginTop:10 }} placeholder="Précisez le type de cuisine…" value={autrePrecision.cuisine??''} onChange={e => setAutrePrecision(p=>({...p, cuisine:e.target.value}))} />}
                </div>
              )}

              <div style={CARD}>
                <SectionTitle>Réseaux & Disponibilité</SectionTitle>
                <Field label="Électricité">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {ELEC_OPTS.map(o => <Chip key={o.value} label={o.label} active={elec===o.value} onClick={() => setElec(elec===o.value?'non':o.value)} />)}
                    <Chip label="Autre (à préciser)" active={elec==='autre'} onClick={() => setElec(elec==='autre'?'non':'autre')} />
                  </div>
                  {elec==='autre' && <SInput style={{ marginTop:10 }} placeholder="Précisez la source d'électricité…" value={autrePrecision.elec??''} onChange={e => setAutrePrecision(p=>({...p, elec:e.target.value}))} />}
                </Field>
                {elec==='decompteur' && <div style={{ paddingLeft:16, paddingBottom:8 }}><Field label="Prix au kWh (FCFA)"><SInput type="number" min="0" placeholder="Ex : 125" value={prixKwh} onChange={e => setPrixKwh(e.target.value)} /></Field></div>}

                <Field label="Eau">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {EAU_OPTS.map(o => <Chip key={o.value} label={o.label} active={eau===o.value} onClick={() => setEau(eau===o.value?'non':o.value)} />)}
                    <Chip label="Autre (à préciser)" active={eau==='autre'} onClick={() => setEau(eau==='autre'?'non':'autre')} />
                  </div>
                  {eau==='autre' && <SInput style={{ marginTop:10 }} placeholder="Précisez la source d'eau…" value={autrePrecision.eau??''} onChange={e => setAutrePrecision(p=>({...p, eau:e.target.value}))} />}
                </Field>
                {eau==='soneb' && (
                  <div style={{ paddingLeft:16, paddingBottom:8 }}>
                    <Field label="Mode de gestion SONEB">
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        <Chip label="Entre voisins" active={sonebG==='voisins'}  onClick={() => setSonebG(sonebG==='voisins'?'':'voisins')} />
                        <Chip label="Prix au m³"    active={sonebG==='prix_m3'} onClick={() => setSonebG(sonebG==='prix_m3'?'':'prix_m3')} />
                        <Chip label="Autre (à préciser)" active={sonebG==='autre'} onClick={() => setSonebG(sonebG==='autre'?'':'autre')} />
                      </div>
                      {sonebG==='autre' && <SInput style={{ marginTop:8 }} placeholder="Précisez…" value={autrePrecision.soneb_gestion??''} onChange={e => setAutrePrecision(p=>({...p, soneb_gestion:e.target.value}))} />}
                    </Field>
                    {sonebG==='prix_m3' && <Field label="Prix au m³ (FCFA)"><SInput type="number" min="0" placeholder="Ex : 450" value={prixM3} onChange={e => setPrixM3(e.target.value)} /></Field>}
                  </div>
                )}
                {eau==='forage' && (
                  <div style={{ paddingLeft:16, paddingBottom:8 }}>
                    <Toggle label="Forage payant" value={forageP} onChange={setForageP} />
                    {forageP && <div style={{ paddingTop:8 }}><Field label="Prix au m³ — forage (FCFA)"><SInput type="number" min="0" placeholder="Ex : 500" value={prixForage} onChange={e => setPrixForage(e.target.value)} /></Field></div>}
                  </div>
                )}
                <Field label="Disponibilité">
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {DISPO_OPTS.map(o => <Chip key={o.value} label={o.label} active={dispo===o.value} onClick={() => setDispo(dispo===o.value?'':o.value)} />)}
                    <Chip label="Autre (à préciser)" active={dispo==='autre'} onClick={() => setDispo(dispo==='autre'?'':'autre')} />
                  </div>
                  {dispo==='autre' && <SInput style={{ marginTop:10 }} placeholder="Précisez la disponibilité…" value={autrePrecision.dispo??''} onChange={e => setAutrePrecision(p=>({...p, dispo:e.target.value}))} />}
                </Field>
              </div>

              <div style={CARD}>
                <SectionTitle>Voisinage & Équipements</SectionTitle>
                <TagPicker label="Points d'intérêt à proximité" preset={VOISINAGE_PRESET} value={voisinage} onChange={setVoisinage} />
                <div style={{ marginTop:4 }}><TagPicker label="Équipements inclus" preset={EQUIPEMENT_PRESET} value={equips} onChange={setEquips} /></div>
              </div>
            </>
          )}

          {/* ═══ HONORAIRES ═══ */}
          {activeTab === 'Honoraires' && (
            <div style={CARD}>
              <SectionTitle>Conditions financières</SectionTitle>
              <p style={{ fontSize:12, color:'#64748B', margin:'0 0 20px', lineHeight:1.6 }}>Ces données sont définies par le propriétaire ou l'agent à la création. Le loyer mensuel est éditable dans l'onglet <strong>Type & Prix</strong>.</p>
              {([
                ['Loyer mensuel',       bien.prix!=null ? `${Number(bien.prix).toLocaleString('fr-FR')} FCFA / mois` : '—'],
                ['Avance',              amenites.avance_mois!=null ? `${amenites.avance_mois} mois` : '—'],
                ['Loyer prépayé',       amenites.loyer_prepaye_mois!=null ? `${amenites.loyer_prepaye_mois} mois` : '—'],
                ['Caution eau',         amenites.caution_eau!=null ? `${Number(amenites.caution_eau).toLocaleString('fr-FR')} FCFA` : '—'],
                ['Caution électricité', amenites.caution_elec!=null ? `${Number(amenites.caution_elec).toLocaleString('fr-FR')} FCFA` : '—'],
                ['Frais de visite',     bien.frais_visite!=null ? `${Number(bien.frais_visite).toLocaleString('fr-FR')} FCFA` : '—'],
                ['Échéance paiement',   amenites.echeance_mois!=null ? `${amenites.echeance_mois} mois` : '—'],
              ] as [string,string][]).map(([lbl,val]) => (
                <div key={lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid #E2E8F0' }}>
                  <span style={{ fontSize:13, color:'#64748B' }}>{lbl}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop:16, padding:14, background:'#F0F9FF', borderRadius:8, border:'1px solid #BAE6FD' }}>
                <p style={{ fontSize:12, color:'#075985', margin:0, lineHeight:1.7 }}>
                  <strong>Commission</strong>
                  {isOwner
                    ? <span> : 500 FCFA fixe (annonce propriétaire — lecture seule)</span>
                    : amenites.commission_agence != null
                      ? <span> : Montant défini par l'agent à la création — <strong>{Number(amenites.commission_agence).toLocaleString('fr-FR')} FCFA</strong> (lecture seule)</span>
                      : <span> : Montant défini par l'agent à la création (non précisé)</span>
                  }
                </p>
              </div>
            </div>
          )}

          {/* ═══ PHOTOS ═══ */}
          {activeTab === 'Photos' && (
            <>
              <div style={{ ...CARD, border:'2px dashed #2563EB', background:'#F8FAFC', cursor:'pointer', textAlign:'center' }}
                onClick={() => document.getElementById('ph-inp')?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}>
                <input id="ph-inp" type="file" accept="image/*" multiple style={{ display:'none' }} onChange={e => handleUpload(e.target.files)} />
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'12px 0', color:'#2563EB' }}>
                  <UploadIcon/>
                  <span style={{ fontSize:13, fontWeight:600 }}>Cliquer ou glisser des photos ici</span>
                  <span style={{ fontSize:11, color:'#64748B' }}>JPG, PNG, WebP — 5 Mo max par photo</span>
                </div>
              </div>
              {photos.length === 0 ? (
                <div style={{ ...CARD, textAlign:'center', color:'#64748B', fontSize:13, padding:'40px 24px' }}>Aucune photo. Ajoutez-en ci-dessus.</div>
              ) : (
                <>
                  <p style={{ fontSize:12, color:'#64748B', margin:'0 0 12px', lineHeight:1.5 }}>Étoile = photo principale (première dans l'app). Cliquez pour modifier, corbeille pour supprimer.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:12 }}>
                    {photos.map(ph => (
                      <div key={ph.id} style={{ position:'relative', borderRadius:10, overflow:'hidden', border: ph.is_cover ? '2.5px solid #2563EB' : '1.5px solid #E2E8F0', background:'#F8FAFC' }}>
                        <img src={ph.url} alt="" style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover', display:'block', opacity: ph.uploading?.5:1 }}/>
                        {ph.uploading && <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,.6)', fontSize:12, color:'#64748B' }}>Upload…</div>}
                        {ph.is_cover && <div style={{ position:'absolute', top:8, left:8, background:'#2563EB', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4 }}>PRINCIPALE</div>}
                        {!ph.uploading && (
                          <div style={{ position:'absolute', bottom:0, left:0, right:0, display:'flex', gap:6, padding:8, background:'linear-gradient(to top,rgba(0,0,0,.5),transparent)' }}>
                            <button title="Photo principale" onClick={() => !ph.is_cover && handleCover(ph.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:6, border:'none', cursor:ph.is_cover?'default':'pointer', background:ph.is_cover?'#2563EB':'rgba(255,255,255,.85)', color:ph.is_cover?'#fff':'#64748B' }}><StarIcon/></button>
                            <button title="Supprimer" onClick={() => handleDelete(ph.id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:6, border:'none', cursor:'pointer', background:'rgba(255,255,255,.85)', color:'#DC2626', marginLeft:'auto' }}><TrashIcon size={12}/></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
