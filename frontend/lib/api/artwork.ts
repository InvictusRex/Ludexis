import { apiClient } from "./client";
import type {
  ArtworkMissingItem,
  ArtworkType,
  ArtworkUploadResponse,
  ArtworkReplaceResponse,
  ArtworkDeleteResponse,
  JobHistory,
} from "@/lib/types";

export interface ArtworkUploadInput {
  archive_entry_id: string;
  artwork_type: ArtworkType;
  file: File;
  caption?: string | null;
}

export interface ArtworkReplaceInput extends ArtworkUploadInput {
  screenshot_id?: string | null;
}

export const artworkApi = {
  async getMissing(): Promise<ArtworkMissingItem[]> {
    return apiClient.get<ArtworkMissingItem[]>("/artwork/missing");
  },

  async upload(input: ArtworkUploadInput): Promise<ArtworkUploadResponse> {
    const form = new FormData();
    form.set("archive_entry_id", input.archive_entry_id);
    form.set("artwork_type", input.artwork_type);
    form.set("file", input.file);

    if (input.caption) {
      form.set("caption", input.caption);
    }

    return apiClient.post<ArtworkUploadResponse>("/artwork/upload", form);
  },

  async replace(input: ArtworkReplaceInput): Promise<ArtworkReplaceResponse> {
    const form = new FormData();
    form.set("archive_entry_id", input.archive_entry_id);
    form.set("artwork_type", input.artwork_type);
    form.set("file", input.file);

    if (input.screenshot_id) {
      form.set("screenshot_id", input.screenshot_id);
    }

    if (input.caption) {
      form.set("caption", input.caption);
    }

    return apiClient.patch<ArtworkReplaceResponse>("/artwork/replace", form);
  },

  /** Images the game's matched sources offer for one slot. */
  async candidates(archiveEntryId: string, artworkType: ArtworkType): Promise<string[]> {
    return apiClient.get<string[]>(`/artwork/${archiveEntryId}/candidates?artwork_type=${artworkType}`);
  },

  async fromUrl(archiveEntryId: string, artworkType: ArtworkType, url: string): Promise<ArtworkReplaceResponse> {
    return apiClient.post<ArtworkReplaceResponse>("/artwork/from-url", {
      archive_entry_id: archiveEntryId,
      artwork_type: artworkType,
      url,
    });
  },

  async remove(
    artworkId: string,
    artworkType?: ArtworkType,
  ): Promise<ArtworkDeleteResponse> {
    const qs = artworkType ? `?artwork_type=${artworkType}` : "";
    return apiClient.delete<ArtworkDeleteResponse>(`/artwork/${artworkId}${qs}`);
  },

  // Queues a background job and returns it.
  async autoDownload(): Promise<JobHistory> {
    return apiClient.post<JobHistory>("/artwork/auto-download");
  },
};
