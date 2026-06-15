import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Developer } from "@/lib/types";

export const developersApi = {
  async getAll(token?: string): Promise<Developer[]> {
    return apiClient.get<Developer[]>("/developers", token);
  },

  async getById(id: string, token?: string): Promise<Developer> {
    return apiClient.get<Developer>(`/developers/${id}`, token);
  },

  async getEntries(id: string, token?: string) {
    return archiveApi.getByDeveloper(id, token);
  },
};
