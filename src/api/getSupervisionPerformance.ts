import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export type PerformanceAdminHebdo = {
  admin_id: number;
  nom: string | null;
  prenom: string | null;
  semaine_debut: string;
  nb_biens_valides: number;
};

export const getSupervisionPerformance = {
  hebdo: (semaines = 8): Promise<PerformanceAdminHebdo[]> =>
    axios.get(`${BASE}/admin/supervision/performance-hebdo`, { ...auth(), params: { semaines } }).then(r => r.data),
};
