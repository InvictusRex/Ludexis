import { apiClient } from "./client";
import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
} from "@/lib/types";

export const collectionsApi = {
  /** includeHidden also lists collections hidden in the server settings. */
  async getAll(offset = 0, limit = 100, q?: string, includeHidden = false): Promise<Collection[]> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    if (includeHidden) {
      params.set("include_hidden", "true");
    }
    return apiClient.get<Collection[]>(`/collections/?${params.toString()}`);
  },

  async getById(id: string): Promise<Collection> {
    return apiClient.get<Collection>(`/collections/${id}`);
  },


  async create(data: CollectionCreate): Promise<Collection> {
    return apiClient.post<Collection>("/collections/", data);
  },

  async update(id: string, data: CollectionUpdate): Promise<Collection> {
    return apiClient.patch<Collection>(`/collections/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/collections/${id}`);
  },

  async addEntry(id: string, entryId: string): Promise<Collection> {
    return apiClient.post<Collection>(`/collections/${id}/entries`, {
      entry_id: entryId,
    });
  },

  async removeEntry(id: string, entryId: string): Promise<void> {
    return apiClient.delete<void>(`/collections/${id}/entries/${entryId}`);
  },
};
