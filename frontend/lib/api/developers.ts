import { apiClient } from "./client";
import { archiveApi } from "./archives";
import type { Developer } from "@/lib/types";

export const developersApi = {
  async getAll(): Promise<Developer[]> {
    return apiClient.get<Developer[]>("/developers");
  },

  async getById(id: string): Promise<Developer> {
    return apiClient.get<Developer>(`/developers/${id}`);
  },

  async getEntries(id: string) {
    return archiveApi.getByDeveloper(id);
  },
};
