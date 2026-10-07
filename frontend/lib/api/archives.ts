import { apiClient } from "./client";
import type {
  ArchiveEntry,
  ArchiveEntryUpdate,
  JobHistory,
  LibraryQuery,
} from "@/lib/types";

export interface IdentifyResult {
  entry: ArchiveEntry;
  updated_entries: number;
  artwork_job: JobHistory;
}

export const archiveApi = {
  async getAll(offset = 0, limit = 100): Promise<ArchiveEntry[]> {
    const qs = `?offset=${offset}&limit=${limit}`;
    return apiClient.get<ArchiveEntry[]>(`/archive-entries/${qs}`);
  },

  // One page of the library, filtered and sorted on the server; total comes from X-Total-Count.
  async browse(query: LibraryQuery = {}): Promise<{ items: ArchiveEntry[]; total: number }> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "" && value !== false) {
        params.set(key, String(value));
      }
    }
    return apiClient.getList<ArchiveEntry>(`/search/?${params.toString()}`);
  },

  async getById(id: string): Promise<ArchiveEntry> {
    return apiClient.get<ArchiveEntry>(`/archive-entries/${id}`);
  },

  async getDuplicates(): Promise<import("@/lib/types").DuplicateGroup[]> {
    return apiClient.get<import("@/lib/types").DuplicateGroup[]>(
      "/archive-entries/duplicates",
    );
  },

  async identify(id: string, provider: string, providerId: string): Promise<IdentifyResult> {
    return apiClient.post<IdentifyResult>(`/archive-entries/${id}/identify`, {
      provider,
      provider_id: providerId,
    });
  },

  /** Shows the game's file or folder in the server's file manager; 404 when it is not there. */
  async openLocation(id: string): Promise<{ path: string; opened: boolean }> {
    return apiClient.post<{ path: string; opened: boolean }>(`/archive-entries/${id}/open-location`);
  },

  async getVersions(id: string): Promise<ArchiveEntry[]> {
    return apiClient.get<ArchiveEntry[]>(`/archive-entries/${id}/versions`);
  },

  async getScreenshots(id: string): Promise<import("@/lib/types").Screenshot[]> {
    return apiClient.get<import("@/lib/types").Screenshot[]>(
      `/archive-entries/${id}/screenshots`,
    );
  },

  async update(
    id: string,
    data: ArchiveEntryUpdate,
  ): Promise<ArchiveEntry> {
    return apiClient.patch<ArchiveEntry>(`/archive-entries/${id}`, data);
  },

  async updateMetadata(
    id: string,
    data: import("@/lib/types").ArchiveMetadataUpdate,
  ): Promise<ArchiveEntry> {
    return apiClient.patch<ArchiveEntry>(
      `/archive-entries/${id}/metadata`,
      data,
    );
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/archive-entries/${id}`);
  },
};
