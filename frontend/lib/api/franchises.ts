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

  /** Images to choose from: stored paths of its games' art, and SteamGridDB URLs. */
  async imageCandidates(id: string): Promise<string[]> {
    return apiClient.get<string[]>(`/franchises/${id}/image-candidates`);
  },

  async chooseImage(id: string, source: string): Promise<Franchise> {
    return apiClient.put<Franchise>(`/franchises/${id}/image`, { source });
  },

  async uploadImage(id: string, file: File): Promise<Franchise> {
    const form = new FormData();
    form.set("file", file);
    return apiClient.post<Franchise>(`/franchises/${id}/image`, form);
  },

  /** Back to the automatic image. */
  async resetImage(id: string): Promise<Franchise> {
    return apiClient.delete<Franchise>(`/franchises/${id}/image`);
  },
};
