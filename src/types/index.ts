// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════

export type UserRole =
  | 'prospect'
  | 'locataire'
  | 'demarcheur'
  | 'proprietaire'
  | 'admin'
  | 'super_admin'
  | 'detenteur';  // déprécié — conservé pour rétrocompat

export interface User {
  id: number;
  role: UserRole;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  profil_complet: boolean;
  actif: boolean;
  score_credibilite: number;
  nb_etoiles: number;
  created_at: string;
  updated_at: string;
}

// ══════════════════════════════════════════════════════════════
// BIENS
// ══════════════════════════════════════════════════════════════

export type TypeBien = 'maison' | 'appart_vide' | 'appart_meuble' | 'guesthouse' | 'terrain';
export type TypeTransaction = 'vente' | 'location';
export type StatutBien = 'actif' | 'vendu' | 'loue' | 'archive';
export type StatutModeration = 'en_attente' | 'approuve' | 'rejete' | 'conditionnel';

export interface Localisation {
  id: number;
  adresse: string | null;
  ville: string;
  quartier: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Photo {
  id: number;
  url: string;
  is_cover: boolean;
}

export interface Piece {
  id: number;
  nom: string;
  surface: number | null;
}

export interface Bien {
  id: number;
  user_id: number;
  user?: User;
  localisation: Localisation;
  type: TypeBien;
  transaction: TypeTransaction;
  prix: number;
  frais_visite: number;
  description: string | null;
  statut: StatutBien;
  statut_moderation: StatutModeration;
  motif_refus: string | null;
  conditions_speciales: string | null;
  score_qualite: number;
  nb_consultations: number;
  created_at: string;
  updated_at: string;
  pieces: Piece[];
  photos: Photo[];
}

// ══════════════════════════════════════════════════════════════
// LOYERS & CONTRATS
// ══════════════════════════════════════════════════════════════

export type StatutContrat = 'actif' | 'resilie' | 'expire';
export type StatutLoyer   = 'en_attente' | 'en_retard' | 'paye' | 'impaye';

export interface Contrat {
  id: number;
  bien_id: number;
  locataire_id: number;
  gestionnaire_id: number;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  jour_echeance: number;
  statut: StatutContrat;
  notes: string | null;
  created_at: string;
}

export interface Loyer {
  id: number;
  contrat_id: number;
  contrat?: Contrat;
  mois: string;
  date_echeance: string;
  montant: number;
  statut: StatutLoyer;
  date_paiement: string | null;
  jours_retard: number;
  escalade_admin: boolean;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════
// PAIEMENTS / TRANSACTIONS
// ══════════════════════════════════════════════════════════════

export type TypeTransaction2   = 'frais_visite' | 'loyer' | 'virement';
export type StatutTransaction  = 'en_attente' | 'confirme' | 'echoue' | 'rembourse';
export type MethodePaiement    = 'momo' | 'flooz' | 'celtiis';

export interface Commission {
  id: number;
  montant_brut: number;
  taux_commission: number;
  montant_commission: number;
  montant_net: number;
  virement_effectue: boolean;
}

export interface Transaction {
  id: number;
  reference: string;
  type: TypeTransaction2;
  statut: StatutTransaction;
  methode_paiement: MethodePaiement;
  montant: number;
  payeur_id: number;
  beneficiaire_id: number | null;
  telephone_paiement: string;
  reference_externe: string | null;
  commission?: Commission;
  created_at: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totaux: {
    confirme: number;
    en_attente: number;
  };
}

// ══════════════════════════════════════════════════════════════
// FEEDBACKS
// ══════════════════════════════════════════════════════════════

export type TypeFeedback = 'post_visite' | 'post_integration' | 'meteo';

export interface Feedback {
  id: number;
  auteur_id: number;
  bien_id: number | null;
  visite_id: number | null;
  type: TypeFeedback;
  note: number | null;
  commentaire: string | null;
  probleme_meteo: boolean;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginPayload {
  email?: string;
  telephone?: string;
  password: string;
}

// ══════════════════════════════════════════════════════════════
// STATS ADMIN
// ══════════════════════════════════════════════════════════════

export interface AdminStats {
  total_users: number;
  prospects: number;
  locataires: number;
  demarcheurs: number;
  proprietaires: number;
  total_biens: number;
  biens_en_attente: number;
  biens_approuves: number;
}

// ══════════════════════════════════════════════════════════════
// PAGINATION
// ══════════════════════════════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
