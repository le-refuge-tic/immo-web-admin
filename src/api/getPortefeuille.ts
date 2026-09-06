import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type Portefeuille = {
  semaine_debut: string;
  semaine_fin: string;
  nb_biens_valides: number;
  montant: number;
  palier_atteint: boolean;
};

export const getPortefeuille = {
  get: (): Promise<Portefeuille> => axios.get(`${BASE}/users/me/portefeuille`, auth()).then(r => r.data),
};
