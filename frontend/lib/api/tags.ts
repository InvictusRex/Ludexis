import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Tag } from "@/lib/types";

export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    return apiClient.get<Tag[]>("/tags");
  },

  async getById(id: string): Promise<Tag> {
    return apiClient.get<Tag>(`/tags/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByTag(id);
  },

  async getRelatedTags(id: string) {
    // Naive related tags: return some tags from all tags for now
    const all = await tagsApi.getAll();
    return all.filter((t) => t.id !== id).slice(0, 6);
  },
};
