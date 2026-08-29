import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const supervisionApi = {
  getBiens: (commercialId: number) =>
    axios.get(`${BASE}/admin/commerciaux/${commercialId}/biens`, auth()).then(r => r.data),

  getConversations: (commercialId: number) =>
    axios.get(`${BASE}/admin/commerciaux/${commercialId}/conversations`, auth()).then(r => r.data),

  getProprietaireConversations: (proprietaireId: number) =>
    axios.get(`${BASE}/admin/proprietaires/${proprietaireId}/conversations`, auth()).then(r => r.data),

  getMessages: (convId: number, params?: { page?: number; limit?: number }) =>
    axios.get(`${BASE}/admin/conversations/${convId}/messages`, { ...auth(), params }).then(r => r.data),

  replyAsCommercial: (convId: number, contenu: string) =>
    axios.post(`${BASE}/admin/conversations/${convId}/messages`, { contenu }, auth()).then(r => r.data),

  deleteMessage: (convId: number, msgId: number) =>
    axios.delete(`${BASE}/admin/conversations/${convId}/messages/${msgId}`, auth()).then(r => r.data),
};
