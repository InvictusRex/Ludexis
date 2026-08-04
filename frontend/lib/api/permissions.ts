import { apiClient } from "./client";
import type { PermissionRead, PermissionCreate } from "@/lib/types";

export const permissionsApi = {
  async getAll(): Promise<PermissionRead[]> {
    return apiClient.get<PermissionRead[]>("/permissions/");
  },

  async getById(id: string): Promise<PermissionRead> {
    return apiClient.get<PermissionRead>(`/permissions/${id}`);
  },

  async create(data: PermissionCreate): Promise<PermissionRead> {
    return apiClient.post<PermissionRead>("/permissions/", data);
  },
};
