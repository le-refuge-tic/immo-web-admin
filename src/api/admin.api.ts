import api from './axios';
import type {
  AdminStats, User, Bien, Loyer, Contrat, Feedback,
  PaginatedResponse, TransactionsResponse,
  StatutModeration, StatutLoyer, StatutContrat, StatutTransaction, UserRole,
} from '../types';

// ── Query params ──────────────────────────────────────────────

export interface UsersQuery {
  page?: number; limit?: number; role?: string; actif?: string; search?: string;
}

export interface BiensQuery {
  page?: number; limit?: number; type?: string; transaction?: string;
  statut?: string; statut_moderation?: StatutModeration; search?: string;
}

export interface LoyersQuery {
  page?: number; limit?: number; statut?: StatutLoyer; escalade?: string;
}

export interface ContratsQuery {
  page?: number; limit?: number; statut?: StatutContrat;
}

export interface TransactionsQuery {
  page?: number; limit?: number; statut?: StatutTransaction; type?: string;
}

export interface FeedbacksQuery {
  page?: number; limit?: number; type?: string; probleme_meteo?: string;
}

export interface CreateAdminPayload {
  nom: string; prenom: string; email: string; password: string;
}

export interface ModerateBienPayload {
  statut_moderation: StatutModeration;
  motif_refus?: string;
  conditions_speciales?: string;
}

// ── API ───────────────────────────────────────────────────────

export const adminApi = {
  // Stats dashboard
  getStats: () =>
    api.get<AdminStats>('/admin/stats').then((r) => r.data),

  // Utilisateurs
  getUsers: (params?: UsersQuery) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  updateUser: (id: number, body: { actif?: boolean; role?: UserRole }) =>
    api.patch<User>(`/admin/users/${id}`, body).then((r) => r.data),

  deleteUser: (id: number) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),

  // Biens & modération
  getBiens: (params?: BiensQuery) =>
    api.get<PaginatedResponse<Bien>>('/admin/biens', { params }).then((r) => r.data),

  moderateBien: (id: number, payload: ModerateBienPayload) =>
    api.patch(`/admin/biens/${id}/moderation`, payload).then((r) => r.data),

  deleteBien: (id: number) =>
    api.delete(`/admin/biens/${id}`).then((r) => r.data),

  // Admins
  getAdmins: () =>
    api.get<User[]>('/admin/admins').then((r) => r.data),

  createAdmin: (dto: CreateAdminPayload) =>
    api.post<{ message: string; user: User }>('/admin/admins', dto).then((r) => r.data),

  deleteAdmin: (id: number) =>
    api.delete(`/admin/admins/${id}`).then((r) => r.data),

  // Loyers
  getLoyers: (params?: LoyersQuery) =>
    api.get<PaginatedResponse<Loyer>>('/admin/loyers', { params }).then((r) => r.data),

  // Contrats
  getContrats: (params?: ContratsQuery) =>
    api.get<PaginatedResponse<Contrat>>('/admin/contrats', { params }).then((r) => r.data),

  // Transactions / finances
  getTransactions: (params?: TransactionsQuery) =>
    api.get<TransactionsResponse>('/admin/transactions', { params }).then((r) => r.data),

  // Feedbacks
  getFeedbacks: (params?: FeedbacksQuery) =>
    api.get<PaginatedResponse<Feedback>>('/admin/feedbacks', { params }).then((r) => r.data),
};
