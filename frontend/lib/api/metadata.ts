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
