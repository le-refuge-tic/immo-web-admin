import axios from 'axios';
import type { LimitesRetrait, NumeroRetraitInfo, OperateurRetrait } from '../utils/retraitCommercial';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/** Demande de retrait vue par son titulaire (`GET /retraits/me`) : rien de technique. */
export type Retrait = {
  id: number;
  wallet_id?: number;
  montant: number;
  /** en_attente, en_cours, en_attente_fonds, envoye, echoue, rejete (ou approuve : anciennes demandes). */
  statut: string;
  operateur?: string | null;
  /** Destination masquée par le serveur. */
  numero_masque?: string;
  /** Phrase prête à afficher (échec remboursé, attente…). */
  message?: string | null;
  created_at: string;
  updated_at?: string;
};

export const postRetrait = {
  /**
   * Débite le portefeuille puis lance tout de suite le virement Mobile Money vers le numéro
   * enregistré sur le compte, via l'opérateur choisi pour CE retrait. La clé d'idempotence évite
   * un double débit si la demande est renvoyée.
   */
  demander: (montant: number, wallet_type: string, operateur: OperateurRetrait, idempotencyKey: string): Promise<Retrait> =>
    axios.post(`${BASE}/retraits/me`, { montant, wallet_type, operateur }, {
      headers: { ...auth().headers, 'Idempotency-Key': idempotencyKey },
    }).then(r => r.data),

  mesRetraits: (): Promise<Retrait[]> =>
    axios.get(`${BASE}/retraits/me`, auth()).then(r => (Array.isArray(r.data) ? r.data : (r.data?.data ?? []))),

  /** Montants minimum et maximum par retrait, fixés côté serveur. */
  limites: (): Promise<LimitesRetrait> =>
    axios.get(`${BASE}/retraits/limites`, auth()).then(r => r.data),

  /** Numéro Mobile Money (par défaut : téléphone du compte), dernier opérateur utilisé et éventuelle suspension. */
  numeroRetrait: (): Promise<NumeroRetraitInfo> =>
    axios.get(`${BASE}/wallets/me/numero-retrait`, auth()).then(r => r.data),

  /** Étape 1 : un code SMS part vers le téléphone ACTUEL du compte. */
  initierNumero: (nouveauNumero: string, motDePasse: string): Promise<{ session_token: string }> =>
    axios.post(`${BASE}/wallets/me/numero-retrait/initier`, { nouveau_numero: nouveauNumero, mot_de_passe: motDePasse }, auth())
      .then(r => r.data),

  /** Étape 2 : confirme le code ; un vrai changement de numéro suspend les retraits 48 h. */
  confirmerNumero: (sessionToken: string, codeOtp: string, nouveauNumero: string): Promise<{ retraits_suspendus?: boolean }> =>
    axios.post(`${BASE}/wallets/me/numero-retrait/confirmer`, { session_token: sessionToken, code_otp: codeOtp, nouveau_numero: nouveauNumero }, auth())
      .then(r => r.data),
};
