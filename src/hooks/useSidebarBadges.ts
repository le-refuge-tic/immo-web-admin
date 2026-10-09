import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { getMessages, getActiveCommercialIds } from '../api/getMessages';
import { getAdminStats } from '../api/getAdminStats';
import { getQuartiers } from '../api/getQuartiers';
import { getMesBiens } from '../api/getMesBiens';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';
const SOCKET_BASE = BASE.replace(/\/api\/v1\/?$/, '');
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } });

/** Filet de sécurité si le WebSocket est coupé ; les mises à jour normales arrivent par événements. */
const POLL_MS = 30_000;
/** Événement à émettre après une action qui change un compteur (modération, retrait, quartier…). */
export const BADGES_REFRESH_EVENT = 'badges-refresh';

export function refreshSidebarBadges() {
  window.dispatchEvent(new CustomEvent(BADGES_REFRESH_EVENT));
}

// ── Statuts vus des annonces d'un commercial (badge « Mes annonces ») ─────────
// Clé par utilisateur : sur un poste partagé, chaque compte a son propre historique.
const seenKey = (userId?: number) => `commercial_biens_seen_${userId ?? 'anon'}`;

function getSeenStatuts(userId?: number): Record<number, string> {
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSeenStatuts(userId: number | undefined, map: Record<number, string>) {
  try { localStorage.setItem(seenKey(userId), JSON.stringify(map)); } catch { /* stockage indisponible */ }
}

export function markBiensAsSeen(userId: number | undefined, biens: { id: number; statut_moderation: string }[]) {
  const map: Record<number, string> = {};
  for (const b of biens) map[b.id] = b.statut_moderation;
  saveSeenStatuts(userId, map);
  window.dispatchEvent(new CustomEvent('biens-seen'));
}

export type SidebarBadges = {
  supervision: number;
  messages: number;
  moderation: number;
  quartiers: number;
  retraits: number;
  mesAnnonces: number;
};

const EMPTY: SidebarBadges = { supervision: 0, messages: 0, moderation: 0, quartiers: 0, retraits: 0, mesAnnonces: 0 };

/**
 * Compteurs de la sidebar, regroupés : un seul socket, un seul polling de
 * secours (onglet visible uniquement) et des rafraîchissements ciblés par
 * événement (messages:maj, moderation:maj, lecture d'une conversation…).
 */
export function useSidebarBadges({ isAdmin, isCommercial, userId }: { isAdmin: boolean; isCommercial: boolean; userId?: number }) {
  const [badges, setBadges] = useState<SidebarBadges>(EMPTY);
  const set = useCallback((patch: Partial<SidebarBadges>) => setBadges(b => ({ ...b, ...patch })), []);

  const loadMessages = useCallback(() => {
    getMessages.conversations().then(r => {
      const convs: any[] = Array.isArray(r) ? r : (r.data ?? []);
      set({ messages: convs.reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0) });
    }).catch(() => {});
    if (!isAdmin) return;
    getMessages.supervision().then(r => {
      const activeIds = getActiveCommercialIds();
      const convs: any[] = r.data ?? [];
      const supervision = activeIds.size === 0
        ? (r.total_unread ?? 0)
        : convs
            .filter((c: any) => !c.gestionnaire_id || activeIds.has(c.gestionnaire_id))
            .reduce((s: number, c: any) => s + (c.unread_count ?? 0), 0);
      set({ supervision });
    }).catch(() => {});
  }, [isAdmin, set]);

  const loadAdmin = useCallback(async () => {
    if (!isAdmin) return;
    const [stats, quartiers, retraits] = await Promise.allSettled([
      getAdminStats.get(),
      getQuartiers.lister('en_attente'),
      axios.get(`${BASE}/retraits/admin?statut=en_attente`, auth()),
    ]);
    const patch: Partial<SidebarBadges> = {};
    if (stats.status === 'fulfilled') patch.moderation = stats.value?.biens_en_attente ?? 0;
    if (quartiers.status === 'fulfilled') patch.quartiers = Array.isArray(quartiers.value) ? quartiers.value.length : 0;
    if (retraits.status === 'fulfilled') {
      const rd = retraits.value.data;
      patch.retraits = Array.isArray(rd) ? rd.length : (rd?.data?.length ?? 0);
    }
    set(patch);
  }, [isAdmin, set]);

  const loadMesAnnonces = useCallback(() => {
    if (!isCommercial) return;
    getMesBiens.list().then((biens: any[] = []) => {
      const seen = getSeenStatuts(userId);
      // Premier passage : on mémorise l'état actuel sans afficher de badge.
      if (Object.keys(seen).length === 0) {
        markBiensAsSeen(userId, biens);
        set({ mesAnnonces: 0 });
        return;
      }
      set({ mesAnnonces: biens.filter(b => seen[b.id] !== b.statut_moderation).length });
    }).catch(() => {});
  }, [isCommercial, userId, set]);

  const loadAll = useCallback(() => {
    loadMessages();
    loadAdmin();
    loadMesAnnonces();
  }, [loadMessages, loadAdmin, loadMesAnnonces]);

  useEffect(() => {
    // Chargement initial en différé : les setState arrivent hors du rendu de l'effet.
    void Promise.resolve().then(loadAll);
    const tick = () => { if (document.visibilityState === 'visible') loadAll(); };
    const id = setInterval(tick, POLL_MS);
    const onBiensSeen = () => set({ mesAnnonces: 0 });
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('online', tick);
    window.addEventListener(BADGES_REFRESH_EVENT, loadAll);
    window.addEventListener('conv-read', loadMessages);
    window.addEventListener('biens-seen', onBiensSeen);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('online', tick);
      window.removeEventListener(BADGES_REFRESH_EVENT, loadAll);
      window.removeEventListener('conv-read', loadMessages);
      window.removeEventListener('biens-seen', onBiensSeen);
    };
  }, [loadAll, loadMessages, set]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const socket = io(`${SOCKET_BASE}/chat`, { auth: { token }, transports: ['websocket'], reconnectionDelay: 2000 });
    socket.on('message', loadMessages);
    socket.on('messages:maj', loadMessages);
    socket.on('moderation:maj', loadAdmin);
    socket.on('connect', loadAll);
    return () => { socket.disconnect(); };
  }, [userId, loadAll, loadMessages, loadAdmin]);

  return badges;
}
