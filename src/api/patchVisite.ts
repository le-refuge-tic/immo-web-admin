import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchVisite = {
  confirmer:      (id: number) =>
    axios.patch(`${BASE}/visites/${id}/confirmer`, {}, auth()).then(r => r.data),
  contreProposer: (id: number, date_proposee: string) =>
    axios.patch(`${BASE}/visites/${id}/contre-proposer`, { date_proposee }, auth()).then(r => r.data),
  annuler:        (id: number, motif: string) =>
    axios.patch(`${BASE}/visites/${id}/annuler`, { motif }, auth()).then(r => r.data),
  effectuee:      (id: number) =>
    axios.patch(`${BASE}/visites/${id}/effectuee`, {}, auth()).then(r => r.data),
};
