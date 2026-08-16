import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Franchise } from "@/lib/types";

export const franchisesApi = {
  async getAll(
    offset = 0,
    limit = 100,
    q?: string,
  ): Promise<{ items: Franchise[]; total: number }> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    return apiClient.getList<Franchise>(`/franchises/?${params.toString()}`);
  },

  async getById(id: string): Promise<Franchise> {
    return apiClient.get<Franchise>(`/franchises/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByFranchise(id);
  },
};
