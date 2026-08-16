export type ArtworkType = "cover" | "banner" | "logo" | "screenshot";

export interface ArtworkMissingItem {
  archive_entry_id: string;
  title: string;
  missing_types: ArtworkType[];
}

export interface ArtworkUploadResponse {
  archive_entry_id: string;
  artwork_type: ArtworkType;
  file_path: string;
  screenshot_id?: string | null;
  caption?: string | null;
}

export interface ArtworkReplaceResponse {
  archive_entry_id: string;
  artwork_type: ArtworkType;
  file_path: string;
  screenshot_id?: string | null;
  caption?: string | null;
}

export interface ArtworkDeleteResponse {
  archive_entry_id?: string | null;
  artwork_type?: ArtworkType | null;
  screenshot_id?: string | null;
  deleted: boolean;
}
