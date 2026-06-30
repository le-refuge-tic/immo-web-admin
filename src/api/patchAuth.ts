import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchAuth = {
  profile: (data: any) => axios.patch(`${BASE}/users/me`, data, auth()).then(r => r.data),
};
