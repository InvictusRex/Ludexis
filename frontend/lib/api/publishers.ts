import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Publisher } from "@/lib/types";

export const publishersApi = {
  async getAll(token?: string): Promise<Publisher[]> {
    return apiClient.get<Publisher[]>("/publishers", token);
  },

  async getById(id: string, token?: string): Promise<Publisher> {
    return apiClient.get<Publisher>(`/publishers/${id}`, token);
  },

  async getEntries(id: string, token?: string) {
    return archiveApi.getByPublisher(id, token);
  },
};
