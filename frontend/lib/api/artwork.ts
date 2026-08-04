import { apiClient } from "./client";
import { getAccessToken } from "@/lib/auth/token-store";
import { config } from "@/lib/config";
import type {
  ArtworkMissingItem,
  ArtworkType,
  ArtworkUploadResponse,
  ArtworkReplaceResponse,
  ArtworkDeleteResponse,
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

async function multipartRequest<T>(
  endpoint: string,
  form: FormData,
  method: "POST" | "PATCH" = "POST",
): Promise<T> {
  const accessToken = getAccessToken();
  const headers: HeadersInit = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
    method,
    headers,
    body: form,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody.detail) {
        errorMessage =
          typeof errorBody.detail === "string"
            ? errorBody.detail
            : JSON.stringify(errorBody.detail);
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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

    return multipartRequest<ArtworkUploadResponse>("/artwork/upload", form);
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

    return multipartRequest<ArtworkReplaceResponse>(
      "/artwork/replace",
      form,
      "PATCH",
    );
  },

  async remove(
    artworkId: string,
    artworkType?: ArtworkType,
  ): Promise<ArtworkDeleteResponse> {
    const qs = artworkType ? `?artwork_type=${artworkType}` : "";
    return apiClient.delete<ArtworkDeleteResponse>(`/artwork/${artworkId}${qs}`);
  },

  async autoDownload(): Promise<void> {
    return apiClient.post<void>("/artwork/auto-download");
  },
};
