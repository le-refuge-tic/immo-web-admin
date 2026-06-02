import api from './axios';
import type { User, PaginatedResponse } from '../types';

// Routes correctes : la gestion des utilisateurs passe par /admin/users
export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; role?: string; actif?: boolean }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/admin/users/${id}`).then((r) => r.data),

  toggleActif: (id: number, actif: boolean) =>
    api.patch<User>(`/admin/users/${id}`, { actif }).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/admin/users/${id}`).then((r) => r.data),
};
