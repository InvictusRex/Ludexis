import { apiClient } from "./client";
import type { RoleRead, RoleCreate, RoleUpdate } from "@/lib/types";

export const rolesApi = {
  async getAll(): Promise<RoleRead[]> {
    return apiClient.get<RoleRead[]>("/roles/");
  },

  async getById(id: string): Promise<RoleRead> {
    return apiClient.get<RoleRead>(`/roles/${id}`);
  },

  async create(data: RoleCreate): Promise<RoleRead> {
    return apiClient.post<RoleRead>("/roles/", data);
  },

  async update(id: string, data: RoleUpdate): Promise<RoleRead> {
    return apiClient.patch<RoleRead>(`/roles/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/roles/${id}`);
  },
};
