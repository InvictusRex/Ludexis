import { apiClient } from "./client";
import type { ArchiveEntry, SearchFilters } from "@/lib/types";

export const archiveApi = {
  async getAll(
    offset = 0,
    limit = 100,
    token?: string,
  ): Promise<ArchiveEntry[]> {
    const qs = `?offset=${offset}&limit=${limit}`;
    return apiClient.get<ArchiveEntry[]>(`/archive-entries/${qs}`, token);
  },

  async getById(id: string, token?: string): Promise<ArchiveEntry> {
    return apiClient.get<ArchiveEntry>(`/archive-entries/${id}`, token);
  },

  async search(
    query: string,
    filters?: SearchFilters,
    token?: string,
  ): Promise<ArchiveEntry[]> {
    // Backend does not expose a dedicated search endpoint for archive entries,
    // so fetch a page of entries and filter client-side. Consider implementing
    // a backend search endpoint for large datasets.
    const entries = await archiveApi.getAll(0, 1000, token);

    const q = query?.toLowerCase() ?? "";

    let results = entries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description ?? "").toLowerCase().includes(q),
    );

    if (filters?.genres && filters.genres.length > 0) {
      results = results.filter((e) =>
        // `genres` field may not exist on backend model; this preserves previous behavior
        // if present on ArchiveEntry.
        (e as any).genres?.some((g: string) => filters.genres!.includes(g)),
      );
    }

    if (filters?.metadataStatus && filters.metadataStatus.length > 0) {
      results = results.filter((e) =>
        filters.metadataStatus!.includes(e.metadata_status),
      );
    }

    return results;
  },

  async getByDeveloper(
    developerId: string,
    token?: string,
  ): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000, token);
    return entries.filter((e) => e.developer_ids?.includes(developerId));
  },

  async getByPublisher(
    publisherId: string,
    token?: string,
  ): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000, token);
    return entries.filter((e) => e.publisher_ids?.includes(publisherId));
  },

  async getByTag(tagId: string, token?: string): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000, token);
    return entries.filter((e) => e.tag_ids?.includes(tagId));
  },

  async getByFranchise(
    franchiseId: string,
    token?: string,
  ): Promise<ArchiveEntry[]> {
    const entries = await archiveApi.getAll(0, 1000, token);
    return entries.filter(
      (e) =>
        e.parent_series_id === franchiseId || e.franchise_id === franchiseId,
    );
  },

  async update(
    id: string,
    data: Partial<ArchiveEntry>,
    token?: string,
  ): Promise<ArchiveEntry> {
    return apiClient.patch<ArchiveEntry>(`/archive-entries/${id}`, data, token);
  },

  async delete(id: string, token?: string): Promise<void> {
    return apiClient.delete<void>(`/archive-entries/${id}`, token);
  },
};
