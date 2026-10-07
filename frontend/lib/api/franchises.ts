import { apiClient } from "./client";
import type { Franchise, FranchiseCreate, FranchiseUpdate } from "@/lib/types";

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

  async create(data: FranchiseCreate): Promise<Franchise> {
    return apiClient.post<Franchise>("/franchises/", data);
  },

  async update(id: string, data: FranchiseUpdate): Promise<Franchise> {
    return apiClient.patch<Franchise>(`/franchises/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/franchises/${id}`);
  },

};
