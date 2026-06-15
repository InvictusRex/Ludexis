import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Franchise } from "@/lib/types";

export const franchisesApi = {
  async getAll(token?: string): Promise<Franchise[]> {
    return apiClient.get<Franchise[]>("/franchises", token);
  },

  async getById(id: string, token?: string): Promise<Franchise> {
    return apiClient.get<Franchise>(`/franchises/${id}`, token);
  },

  async getEntries(id: string, token?: string) {
    return archiveApi.getByFranchise(id, token);
  },
};
