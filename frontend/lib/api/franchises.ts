import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Franchise } from "@/lib/types";

export const franchisesApi = {
  async getAll(): Promise<Franchise[]> {
    return apiClient.get<Franchise[]>("/franchises");
  },

  async getById(id: string): Promise<Franchise> {
    return apiClient.get<Franchise>(`/franchises/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByFranchise(id);
  },
};
