import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Collection } from "@/lib/types";

export const collectionsApi = {
  async getAll(token?: string): Promise<Collection[]> {
    return apiClient.get<Collection[]>("/collections", token);
  },

  async getById(id: string, token?: string): Promise<Collection> {
    return apiClient.get<Collection>(`/collections/${id}`, token);
  },

  async getEntries(id: string, token?: string) {
    const entries = await archiveApi.getAll(0, 1000, token);
    return entries.filter((e) => e.collection_ids?.includes(id));
  },
};
