import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
} from "@/lib/types";

export const collectionsApi = {
  async getAll(offset = 0, limit = 100, q?: string): Promise<Collection[]> {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (q?.trim()) {
      params.set("q", q.trim());
    }
    return apiClient.get<Collection[]>(`/collections/?${params.toString()}`);
  },

  async getById(id: string): Promise<Collection> {
    return apiClient.get<Collection>(`/collections/${id}`);
  },

  async getEntries(id: string) {
    const entries = await archiveApi.getAll(0, 1000);
    return entries.filter((e) => e.collection_ids?.includes(id));
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
