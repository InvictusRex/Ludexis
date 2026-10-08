import { apiClient } from "./client";
import type { MetadataDetails, MetadataSearchResult } from "@/lib/types";

export const metadataApi = {
  async search(
    query: string,
    providerPriority?: string[],
  ): Promise<MetadataSearchResult[]> {
    const params = new URLSearchParams();
    params.set("q", query);

    if (providerPriority && providerPriority.length > 0) {
      params.set("provider_priority", providerPriority.join(","));
    }

    return apiClient.get<MetadataSearchResult[]>(
      `/metadata/search?${params.toString()}`,
    );
  },

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

  async getDetails(
    providerName: string,
    providerId: string,
  ): Promise<MetadataDetails> {
    return apiClient.get<MetadataDetails>(
      `/metadata/details/${providerName}/${providerId}`,
    );
  },

  async getArtwork(providerName: string, providerId: string): Promise<unknown> {
    return apiClient.get<unknown>(
      `/metadata/artwork/${providerName}/${providerId}`,
    );
  },
};
