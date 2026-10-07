import { apiClient } from "./client";
import type { Tag, TagCreate, TagUpdate } from "@/lib/types";

export const tagsApi = {
  async getAll(
    offset = 0,
    limit = 100,
    q?: string,
  ): Promise<{ items: Tag[]; total: number }> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    return apiClient.getList<Tag>(`/tags/?${params.toString()}`);
  },

  async getById(id: string): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/${id}`);
  },

  async create(data: TagCreate): Promise<Tag> {
    return apiClient.post<Tag>("/tags/", data);
  },

  async update(id: string, data: TagUpdate): Promise<Tag> {
    return apiClient.patch<Tag>(`/tags/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/tags/${id}`);
  },


};
