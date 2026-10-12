import { apiClient } from "./client";
import type { MetadataDetails, MetadataSearchResult, ProviderNotice } from "@/lib/types";

export const metadataApi = {

  /** Interactive search: one provider, or "all" enabled providers in their configured order. */
  async searchProvider(
    query: string,
    provider: string,
    developer?: string,
  ): Promise<MetadataSearchResult[]> {
    const params = new URLSearchParams({ q: query, provider });
    if (developer?.trim()) {
      params.set("developer", developer.trim());
    }
    return apiClient.get<MetadataSearchResult[]>(
      `/metadata/search?${params.toString()}`,
    );
  },

  /** The providers matching uses, in their configured order. */
  async providers(): Promise<string[]> {
    return apiClient.get<string[]>("/metadata/providers");
  },

  /** Current warnings from the providers this account may use. */
  async notices(): Promise<ProviderNotice[]> {
    return apiClient.get<ProviderNotice[]>("/metadata/notices");
  },

};
