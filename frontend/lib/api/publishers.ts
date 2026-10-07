import { apiClient } from "./client";
import type { Publisher, PublisherCreate, PublisherUpdate } from "@/lib/types";

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

  async create(data: PublisherCreate): Promise<Publisher> {
    return apiClient.post<Publisher>("/publishers/", data);
  },

  async update(id: string, data: PublisherUpdate): Promise<Publisher> {
    return apiClient.patch<Publisher>(`/publishers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/publishers/${id}`);
  },

};
