import axios from 'axios';
import type { ApiBrouillons } from '../shared/brouillons/synchroniser';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });
const ESPACE = 'administration';

/** Lot 6 — brouillons du compte connecté gardés sur le serveur (espace administration). */
export const brouillonsApi: ApiBrouillons = {
  lister: () =>
    axios.get(`${BASE}/brouillons-biens`, { ...auth(), params: { espace: ESPACE } }).then(r => r.data),
  lire: (cle: string) =>
    axios.get(`${BASE}/brouillons-biens/${encodeURIComponent(cle)}`, { ...auth(), params: { espace: ESPACE } }).then(r => r.data),
  enregistrer: e =>
    axios.post(`${BASE}/brouillons-biens`, {
      espace: ESPACE, cle: e.cle, famille: e.famille, libelle: e.libelle.slice(0, 120), etape: e.etape, donnees: e.donnees, maj_le: e.majLe,
    }, auth()).then(r => r.data),
  supprimer: (cle: string) =>
    axios.delete(`${BASE}/brouillons-biens/${encodeURIComponent(cle)}`, { ...auth(), params: { espace: ESPACE } }).then(() => undefined),
};
