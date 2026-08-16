import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Publisher } from "@/lib/types";

export const publishersApi = {
  async getAll(
    offset = 0,
    limit = 100,
    q?: string,
  ): Promise<{ items: Publisher[]; total: number }> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    return apiClient.getList<Publisher>(`/publishers/?${params.toString()}`);
  },

  async getById(id: string): Promise<Publisher> {
    return apiClient.get<Publisher>(`/publishers/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByPublisher(id);
  },
};
