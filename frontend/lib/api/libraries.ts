import { apiClient } from "./client";
import type { LibraryRead, LibraryCreate, LibraryUpdate } from "@/lib/types";

export const librariesApi = {
  async getAll(offset = 0, limit = 100): Promise<LibraryRead[]> {
    const qs = `?offset=${offset}&limit=${limit}`;
    return apiClient.get<LibraryRead[]>(`/libraries/${qs}`);
  },

  async getById(id: string): Promise<LibraryRead> {
    return apiClient.get<LibraryRead>(`/libraries/${id}`);
  },

  async create(data: LibraryCreate): Promise<LibraryRead> {
    return apiClient.post<LibraryRead>("/libraries/", data);
  },

  async update(id: string, data: LibraryUpdate): Promise<LibraryRead> {
    return apiClient.patch<LibraryRead>(`/libraries/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/libraries/${id}`);
  },
};
