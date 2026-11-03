import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` },
});

export const configurationFraisVisite = {
  get: () =>
    axios.get<{ montant: number }>(`${BASE}/admin/configuration/frais-visite`, auth()).then(r => r.data),
  update: (montant: number) =>
    axios.patch<{ montant: number }>(
      `${BASE}/admin/configuration/frais-visite`,
      { montant },
      auth(),
    ).then(r => r.data),
};
