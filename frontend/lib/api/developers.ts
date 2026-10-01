import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Developer, DeveloperCreate, DeveloperUpdate } from "@/lib/types";

export const developersApi = {
  async getAll(
    offset = 0,
    limit = 100,
    q?: string,
  ): Promise<{ items: Developer[]; total: number }> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    return apiClient.getList<Developer>(`/developers/?${params.toString()}`);
  },

  async getById(id: string): Promise<Developer> {
    return apiClient.get<Developer>(`/developers/${id}`);
  },

  async create(data: DeveloperCreate): Promise<Developer> {
    return apiClient.post<Developer>("/developers/", data);
  },

  async update(id: string, data: DeveloperUpdate): Promise<Developer> {
    return apiClient.patch<Developer>(`/developers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/developers/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByDeveloper(id);
  },
};
