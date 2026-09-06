import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type Retrait = {
  id: number;
  user_id: number;
  wallet_id: number;
  montant: number;
  statut: 'en_attente' | 'approuve' | 'rejete' | 'envoye' | 'echoue';
  numero_telephone: string;
  motif_rejet: string | null;
  created_at: string;
};

export const postRetrait = {
  demander: (montant: number, wallet_type: string): Promise<Retrait> =>
    axios.post(`${BASE}/retraits/me`, { montant, wallet_type }, auth()).then(r => r.data),
  mesRetraits: (): Promise<Retrait[]> =>
    axios.get(`${BASE}/retraits/me`, auth()).then(r => r.data),
};
