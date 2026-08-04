import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Publisher } from "@/lib/types";

export const publishersApi = {
  async getAll(): Promise<Publisher[]> {
    return apiClient.get<Publisher[]>("/publishers");
  },

  async getById(id: string): Promise<Publisher> {
    return apiClient.get<Publisher>(`/publishers/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByPublisher(id);
  },
};
