import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Tag } from "@/lib/types";

export const tagsApi = {
  async getAll(token?: string): Promise<Tag[]> {
    return apiClient.get<Tag[]>("/tags", token);
  },

  async getById(id: string, token?: string): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/${id}`, token);
  },

  async getEntries(id: string, token?: string) {
    return archiveApi.getByTag(id, token);
  },

  async getRelatedTags(id: string, token?: string) {
    // Naive related tags: return some tags from all tags for now
    const all = await tagsApi.getAll(token);
    return all.filter((t) => t.id !== id).slice(0, 6);
  },
};
