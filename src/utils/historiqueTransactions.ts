/**
 * Lot 17 — historique détaillé des transactions : périodes (heure du Bénin), onglets,
 * état de la page ↔ URL, paramètres envoyés à l'API et libellés. Fonctions pures.
 * Le périmètre (admin / super admin) est imposé par le serveur ; les onglets ne font
 * que pré-filtrer.
 */

export type CleTri = 'date' | 'montant' | 'type' | 'utilisateur';
export type TriHistorique = { cle: CleTri; ordre: 'asc' | 'desc' };

export interface FiltresHistorique {
  /** Dates locales (Bénin) incluses, AAAA-MM-JJ. */
  du?: string;
  au?: string;
  types?: string[];
  statut?: string;
  roles?: string[];
  utilisateur_id?: number;
  bien_id?: number;
  montant_min?: number;
  montant_max?: number;
  methode?: string;
  sens?: 'credit' | 'debit';
}

export type Periode = 'tout' | 'aujourdhui' | '7j' | 'mois' | 'mois_precedent' | 'perso';
export type Onglet = 'tous' | 'moi' | 'admins' | 'commerciaux' | 'demarcheurs' | 'loyers' | 'frais_visite' | 'autres';

export interface EtatHistorique {
  onglet: Onglet;
  periode: Periode;
  /** Filtres saisis (du / au seulement en période personnalisée). */
  filtres: FiltresHistorique;
  tri: TriHistorique;
  page: number;
}

export const TRI_PAR_DEFAUT: TriHistorique = { cle: 'date', ordre: 'desc' };
export const TAILLE_PAGE = 20;

export const PERIODES: { id: Periode; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'aujourdhui', label: 'Aujourd’hui' },
  { id: '7j', label: '7 derniers jours' },
  { id: 'mois', label: 'Mois en cours' },
  { id: 'mois_precedent', label: 'Mois précédent' },
  { id: 'perso', label: 'Personnalisée' },
];

const FUSEAU = 'Africa/Porto-Novo';
const RE_JOUR = /^\d{4}-\d{2}-\d{2}$/;

/** Jour calendaire au Bénin (AAAA-MM-JJ) d'un instant. */
export function jourBenin(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const decaler = (jour: string, jours: number) => {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
};

/** Bornes incluses d'une période prédéfinie, calculées en heure du Bénin. */
export function bornesPeriode(p: Periode, maintenant: Date = new Date()): { du?: string; au?: string } {
  const auj = jourBenin(maintenant);
  const debutMois = `${auj.slice(0, 7)}-01`;
  switch (p) {
    case 'aujourdhui': return { du: auj, au: auj };
    case '7j': return { du: decaler(auj, -6), au: auj };
    case 'mois': return { du: debutMois, au: auj };
    case 'mois_precedent': {
      const fin = decaler(debutMois, -1);
      return { du: `${fin.slice(0, 7)}-01`, au: fin };
    }
    default: return {};
  }
}

/** Onglets visibles : l'admin ne voit que son périmètre, le super admin aussi les paiements. */
export function ongletsPour(superAdmin: boolean): { id: Onglet; label: string }[] {
  const base: { id: Onglet; label: string }[] = [
    { id: 'tous', label: 'Tout' },
    { id: 'moi', label: 'Mon historique' },
    { id: 'admins', label: 'Admins' },
    { id: 'commerciaux', label: 'Commerciaux' },
    { id: 'demarcheurs', label: 'Démarcheurs' },
  ];
  if (!superAdmin) return base;
  return [
    ...base,
    { id: 'loyers', label: 'Loyers' },
    { id: 'frais_visite', label: 'Frais de visite' },
    { id: 'autres', label: 'Autres paiements' },
  ];
}

/** Filtres imposés par un onglet ; ils priment sur ceux de la barre de filtres. */
export function filtresOnglet(onglet: Onglet, moiId: number | undefined): FiltresHistorique {
  switch (onglet) {
    case 'moi': return moiId ? { utilisateur_id: moiId } : {};
    case 'admins': return { roles: ['admin', 'super_admin'] };
    case 'commerciaux': return { roles: ['commercial'] };
    case 'demarcheurs': return { roles: ['demarcheur'] };
    case 'loyers': return { types: ['loyer'] };
    case 'frais_visite': return { types: ['frais_visite'] };
    case 'autres': return { types: ['integration', 'virement', 'depot_wallet'] };
    default: return {};
  }
}

/** Filtres réellement envoyés : saisie + période + onglet (l'onglet l'emporte). */
export function filtresEffectifs(e: EtatHistorique, moiId: number | undefined, maintenant?: Date): FiltresHistorique {
  const { du, au, ...reste } = e.filtres;
  const dates = e.periode === 'perso' ? { du, au } : bornesPeriode(e.periode, maintenant);
  return nettoyer({ ...reste, ...dates, ...filtresOnglet(e.onglet, moiId) });
}

function nettoyer(f: FiltresHistorique): FiltresHistorique {
  return Object.fromEntries(
    Object.entries(f).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)),
  ) as FiltresHistorique;
}

/** Paramètres de requête : listes jointes par des virgules. */
export function versParams(f: FiltresHistorique): Record<string, string | number> {
  const p: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(nettoyer(f))) p[k] = Array.isArray(v) ? v.join(',') : (v as string | number);
  return p;
}

const ONGLETS: Onglet[] = ['tous', 'moi', 'admins', 'commerciaux', 'demarcheurs', 'loyers', 'frais_visite', 'autres'];
const CLES_TRI: CleTri[] = ['date', 'montant', 'type', 'utilisateur'];
const entierPositif = (v: string | null) => {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 ? n : undefined;
};
const montant = (v: string | null) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n >= 0 ? n : undefined;
};
const jeton = (v: string | null) => (v && /^[a-z_]{1,40}$/.test(v) ? v : undefined);
const liste = (v: string | null) => (v ? v.split(',').map(jeton).filter((x): x is string => !!x) : undefined);

/** Relit l'état depuis l'URL ; toute valeur invalide est ignorée. */
export function lireUrl(sp: URLSearchParams, superAdmin: boolean): EtatHistorique {
  const onglet = sp.get('onglet') as Onglet;
  const autorises = ongletsPour(superAdmin).map(o => o.id);
  const periode = sp.get('periode') as Periode;
  const sens = sp.get('sens');
  const cle = sp.get('tri') as CleTri;
  const du = sp.get('du');
  const au = sp.get('au');
  return {
    onglet: ONGLETS.includes(onglet) && autorises.includes(onglet) ? onglet : 'tous',
    periode: PERIODES.some(p => p.id === periode) ? periode : 'tout',
    filtres: nettoyer({
      du: du && RE_JOUR.test(du) ? du : undefined,
      au: au && RE_JOUR.test(au) ? au : undefined,
      types: liste(sp.get('types')),
      statut: jeton(sp.get('statut')),
      roles: liste(sp.get('roles')),
      utilisateur_id: entierPositif(sp.get('utilisateur_id')),
      bien_id: entierPositif(sp.get('bien_id')),
      montant_min: montant(sp.get('montant_min')),
      montant_max: montant(sp.get('montant_max')),
      methode: jeton(sp.get('methode')),
      sens: sens === 'credit' || sens === 'debit' ? sens : undefined,
    }),
    tri: {
      cle: CLES_TRI.includes(cle) ? cle : TRI_PAR_DEFAUT.cle,
      ordre: sp.get('ordre') === 'asc' ? 'asc' : 'desc',
    },
    page: entierPositif(sp.get('page')) ?? 1,
  };
}

/** État → URL, sans les valeurs par défaut (liens courts et partageables). */
export function ecrireUrl(e: EtatHistorique): URLSearchParams {
  const sp = new URLSearchParams();
  if (e.onglet !== 'tous') sp.set('onglet', e.onglet);
  if (e.periode !== 'tout') sp.set('periode', e.periode);
  const { du, au, ...reste } = e.filtres;
  if (e.periode === 'perso') {
    if (du) sp.set('du', du);
    if (au) sp.set('au', au);
  }
  for (const [k, v] of Object.entries(versParams(reste))) sp.set(k, String(v));
  if (e.tri.cle !== TRI_PAR_DEFAUT.cle) sp.set('tri', e.tri.cle);
  if (e.tri.ordre !== TRI_PAR_DEFAUT.ordre) sp.set('ordre', e.tri.ordre);
  if (e.page > 1) sp.set('page', String(e.page));
  return sp;
}

/** Clic sur un en-tête : même colonne → inverse l'ordre ; autre colonne → décroissant. */
export function basculerTri(tri: TriHistorique, cle: CleTri): TriHistorique {
  if (tri.cle === cle) return { cle, ordre: tri.ordre === 'desc' ? 'asc' : 'desc' };
  return { cle, ordre: cle === 'utilisateur' || cle === 'type' ? 'asc' : 'desc' };
}

export function nombrePages(total: number, limit: number = TAILLE_PAGE): number {
  return Math.max(1, Math.ceil(total / limit));
}

/** Lien « Voir son historique » depuis une fiche utilisateur. */
export const lienHistoriqueUtilisateur = (id: number) => `/finances/historique?utilisateur_id=${id}`;

/** Rôles dont l'admin voit l'historique ; le super admin voit tout le monde (décision du 17/11). */
const ROLES_VISIBLES_ADMIN = ['admin', 'commercial', 'demarcheur'];
export const peutVoirHistorique = (roleCible: string | null | undefined, superAdmin: boolean) =>
  superAdmin || ROLES_VISIBLES_ADMIN.includes(roleCible ?? '');

export const LIBELLES_TYPE: Record<string, string> = {
  frais_visite: 'Frais de visite',
  loyer: 'Loyer',
  integration: 'Paiement d’intégration',
  virement: 'Virement sortant',
  depot_wallet: 'Rechargement de portefeuille',
  portefeuille_validation: 'Prime de validation',
  prime_resultat: 'Prime de résultat',
  regularisation: 'Régularisation',
  bonus_admin: 'Bonus',
  retrait: 'Retrait',
  remboursement_retrait: 'Retrait annulé (rendu)',
  depot: 'Crédit',
  paiement_loyer: 'Paiement de loyer',
  transfert_interne: 'Transfert interne',
};

/** Types proposés dans le filtre, selon le périmètre. */
export function typesProposes(superAdmin: boolean): string[] {
  const mouvements = ['portefeuille_validation', 'prime_resultat', 'regularisation', 'bonus_admin', 'retrait', 'remboursement_retrait', 'depot'];
  return superAdmin ? ['frais_visite', 'loyer', 'integration', 'virement', 'depot_wallet', ...mouvements] : mouvements;
}

export const LIBELLES_STATUT: Record<string, string> = {
  confirme: 'Confirmé',
  completed: 'Effectué',
  en_attente: 'En attente',
  pending: 'En attente',
  echoue: 'Échoué',
  failed: 'Échoué',
  rembourse: 'Remboursé',
  anomalie: 'Anomalie',
};

export const LIBELLES_ROLE: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  commercial: 'Commercial',
  demarcheur: 'Démarcheur',
  proprietaire: 'Propriétaire',
  locataire: 'Locataire',
  prospect: 'Prospect',
  plateforme: 'Plateforme',
};

export const LIBELLES_METHODE: Record<string, string> = {
  momo: 'MTN MoMo',
  flooz: 'Moov Flooz',
  celtiis: 'Celtiis Cash',
  fedapay: 'FedaPay',
};

const brut = (v: string) => {
  const s = v.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const libelle = (table: Record<string, string>, v: string | null | undefined) => (v ? table[v] ?? brut(v) : '—');

/** Statut d'une opération aboutie (seules celles-ci comptent dans les totaux). */
export const estAboutie = (statut: string | null) => statut === 'confirme' || statut === 'completed';

/** Date et heure du Bénin, lisibles. */
export function dateHeureBenin(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}
