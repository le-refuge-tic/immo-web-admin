import axios from 'axios';
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/* ── Masque lectures ─────────────────────────────────────────── */

const READ_KEY = 'sup_read_convs';

export function getReadConvIds(): Set<number> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<number>(Array.isArray(parsed) ? parsed.filter((v: unknown) => typeof v === 'number' && isFinite(v)) : []);
  } catch { return new Set<number>(); }
}

export function markConvRead(id: number): void {
  const ids = getReadConvIds();
  ids.add(id);
  try { localStorage.setItem(READ_KEY, JSON.stringify([...ids])); } catch { /**/ }
  window.dispatchEvent(new CustomEvent('conv-read', { detail: { id } }));
}

const ACTIVE_IDS_KEY = 'sup_active_commercial_ids';

export function getActiveCommercialIds(): Set<number> {
  try {
    const raw = localStorage.getItem(ACTIVE_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<number>(Array.isArray(parsed) ? parsed.filter((v: unknown) => typeof v === 'number' && isFinite(v)) : []);
  } catch { return new Set<number>(); }
}

export function setActiveCommercialIds(ids: number[]): void {
  try { localStorage.setItem(ACTIVE_IDS_KEY, JSON.stringify(ids)); } catch { /**/ }
}

/* ── API ─────────────────────────────────────────────────────── */

export const getMessages = {
  conversations: (params?: any) =>
    axios.get(`${BASE}/admin/conversations`, { ...auth(), params }).then(r => {
      const raw = r.data;
      const readIds = getReadConvIds();
      const data: any[] = (raw.data ?? raw).map((c: any) =>
        readIds.has(c.id) ? { ...c, unread_count: 0 } : c
      );
      const total_unread = data.reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
      const result = Array.isArray(raw) ? data : { ...raw, data, total_unread };
      return result;
    }),

  thread: (id: number, params?: any) =>
    axios.get(`${BASE}/admin/conversations/${id}/messages`, { ...auth(), params }).then(r => r.data),

  supervision: (params?: any) =>
    axios.get(`${BASE}/admin/conversations`, { ...auth(), params: { limit: 200, ...params } }).then(r => {
      const raw = r.data;
      const readIds = getReadConvIds();
      const data: any[] = (raw.data ?? raw).map((c: any) =>
        readIds.has(c.id) ? { ...c, unread_count: 0 } : c
      );
      const total_unread = data.reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
      return { data, total: raw.total ?? data.length, total_unread };
    }),
};
