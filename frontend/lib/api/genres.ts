import { apiClient } from "./client";
import type { Genre } from "@/lib/types";

export const genresApi = {
  // Only genres that have at least one game, alphabetical.
  async getAll(): Promise<Genre[]> {
    return apiClient.get<Genre[]>("/genres/");
  },
};
