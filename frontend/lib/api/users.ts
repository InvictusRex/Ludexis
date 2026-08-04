import { apiClient } from "./client";
import type { User, UserCreate, UserUpdate } from "@/lib/types";

export const usersApi = {
  async getAll(skip = 0, limit = 100): Promise<User[]> {
    const qs = `?skip=${skip}&limit=${limit}`;
    return apiClient.get<User[]>(`/users/${qs}`);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async create(data: UserCreate): Promise<User> {
    return apiClient.post<User>("/users/", data);
  },

  async update(id: string, data: UserUpdate): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },

  async activate(id: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/activate`);
  },

  async deactivate(id: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/deactivate`);
  },

  async resetPassword(id: string, newPassword: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/reset-password`, {
      new_password: newPassword,
    });
  },
};
