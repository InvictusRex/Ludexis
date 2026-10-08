
// Sort keys accepted by /search; a leading "-" sorts descending.
export type LibrarySort =
  | "title"
  | "-title"
  | "created_at"
  | "-created_at"
  | "release_date"
  | "-release_date"
  | "file_size"
  | "-file_size"
  | "random";

export interface LibraryQuery {
  q?: string;
  genre?: string;
  tag?: string;
  developer?: string;
  publisher?: string;
  franchise?: string;
  collection?: string;
  collection_id?: string;
  metadata_status?: string;
  verification_status?: string;
  group_versions?: boolean;
  /** Also list games in collections hidden in the server settings. */
  include_hidden?: boolean;
  sort?: LibrarySort;
  offset?: number;
  limit?: number;
}

export interface Genre {
  name: string;
  entry_count: number;
}
