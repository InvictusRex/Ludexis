import { apiClient } from "./client";
import type { ArchiveEntry, ArchiveEntryUpdate, JobHistory, SearchFilters } from "@/lib/types";

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

  async getById(id: string): Promise<ArchiveEntry> {
    return apiClient.get<ArchiveEntry>(`/archive-entries/${id}`);
  },

  async search(
    query: string,
    filters?: SearchFilters,
    offset = 0,
    limit = 200,
    groupVersions = false,
  ): Promise<ArchiveEntry[]> {
    const params = new URLSearchParams();

    if (query?.trim()) {
      params.set("q", query.trim());
    }

    const setFilter = (key: string, values?: string[]) => {
      const value = values?.[0];
      if (value) {
        params.set(key, value);
      }
    };

    setFilter("genre", filters?.genres);
    setFilter("tag", filters?.tags);
    setFilter("developer", filters?.developers);
    setFilter("publisher", filters?.publishers);
    setFilter("franchise", filters?.franchises);
    setFilter("metadata_status", filters?.metadataStatus);
    setFilter("verification_status", filters?.verificationStatus);
    setFilter("storage_device", filters?.storageDevices);

    if (groupVersions) {
      params.set("group_versions", "true");
    }
    params.set("offset", String(offset));
    params.set("limit", String(limit));

    return apiClient.get<ArchiveEntry[]>(`/search/?${params.toString()}`);
  },

  async getByDeveloper(developerId: string): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000);
    return entries.filter((e) => e.developer_ids?.includes(developerId));
  },

  async getByPublisher(publisherId: string): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000);
    return entries.filter((e) => e.publisher_ids?.includes(publisherId));
  },

  async getByTag(tagId: string): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000);
    return entries.filter((e) => e.tag_ids?.includes(tagId));
  },

  async getByFranchise(franchiseId: string): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000);
    return entries.filter(
      (e) =>
        e.parent_series_id === franchiseId || e.franchise_id === franchiseId,
    );
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
