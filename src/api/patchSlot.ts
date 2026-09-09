import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

export const patchSlot = {
  repondre: (messageId: number, response: 'accepted' | 'declined' | 'countered', proposed_at?: string) =>
    axios.patch(`${BASE}/chat/slots/${messageId}`, { response, proposed_at }, auth()).then(r => r.data),
};
