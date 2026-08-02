import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const getDemandes = {
  list: (statut?: string) =>
    axios.get(`${BASE}/admin/demandes-gestion`, { ...auth(), params: statut ? { statut } : {} }).then(r => r.data),

  valider: (id: number, body: { date_debut: string; jour_echeance?: number; loyer_prepaye_mois?: number; notes?: string }) =>
    axios.post(`${BASE}/admin/demandes-gestion/${id}/valider`, body, auth()).then(r => r.data),

  rejeter: (id: number, notes?: string) =>
    axios.post(`${BASE}/admin/demandes-gestion/${id}/rejeter`, { notes }, auth()).then(r => r.data),
};
