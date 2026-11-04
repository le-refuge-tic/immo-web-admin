import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type Conclusion = {
  date: string;
  nature: 'location' | 'vente';
  commission: number;
  prime_resultat: number;
  declaree_le: string;
  credite?: boolean;
};

export type LigneRegularisation = {
  commercial_id: number;
  commercial: string;
  bien_id: number;
  semaine_debut: string;
  montant_du: number;
  montant_credite: number;
  complement: number;
  detail: { categorie_libelle: string };
};

export const remunerationApi = {
  /** Bien loué ou vendu : 10 % de la commission encaissée créditée au commercial. */
  declarerConclusion: (bienId: number, body: { nature: 'location' | 'vente'; commission: number; date?: string }): Promise<Conclusion> =>
    axios.post(`${BASE}/admin/biens/${bienId}/conclusion`, body, auth()).then(r => r.data),
  apercuRegularisation: (): Promise<{ lignes: LigneRegularisation[]; total: number; trop_percus: number }> =>
    axios.get(`${BASE}/admin/commerciaux/regularisation`, auth()).then(r => r.data),
  executerRegularisation: (): Promise<{ versees: number; total: number }> =>
    axios.post(`${BASE}/admin/commerciaux/regularisation`, {}, auth()).then(r => r.data),
};
