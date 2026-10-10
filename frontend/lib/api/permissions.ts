import { apiClient } from "./client";
import type { PermissionRead, PermissionCreate } from "@/lib/types";

export const permissionsApi = {
  async getAll(): Promise<PermissionRead[]> {
    return apiClient.get<PermissionRead[]>("/permissions/");
  },

};
