import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Tag } from "@/lib/types";

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

  async getEntries(id: string) {
    return archiveApi.getByTag(id);
  },

  async getRelatedTags(id: string) {
    // Naive related tags: return some tags from all tags for now
    const { items } = await tagsApi.getAll();
    return items.filter((t) => t.id !== id).slice(0, 6);
  },
};
