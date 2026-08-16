export type MetadataStatus = "MATCHED" | "PARTIAL" | "UNMATCHED" | "MANUAL";
export type VerificationStatus =
  | "VERIFIED"
  | "MISSING"
  | "MOVED"
  | "CORRUPTED"
  | "UNKNOWN";

export type RelationshipType =
  | "FRANCHISE"
  | "SEQUEL"
  | "PREQUEL"
  | "SPINOFF"
  | "COLLECTION"
  | "EPISODE"
  | "REMASTER"
  | "RELATED";

export interface ArchiveEntryReference {
  id: string;
  title: string;
}

export interface DuplicateArchiveEntry {
  id: string;
  title: string;
  file_path: string;
}

export interface DuplicateGroup {
  file_hash: string;
  count: number;
  entries: DuplicateArchiveEntry[];
}

export interface Screenshot {
  id: string;
  archive_entry_id: string;
  file_path: string;
  caption?: string | null;
  created_at: string;
}

export interface ArchiveMetadataUpdate {
  title?: string | null;
  description?: string | null;
  release_date?: string | null;
  metadata_override?: boolean;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  description?: string;
  version?: string;
  engine?: string;
  release_date?: string;
  archive_type?: string;
  file_path: string;
  file_size?: number;
  file_hash?: string;
  storage_device?: string;
  cover_path?: string;
  banner_path?: string;
  logo_path?: string;
  metadata_status: MetadataStatus;
  metadata_source?: string;
  metadata_source_code?: string;
  metadata_override: boolean;
  metadata_confidence?: number | null;
  verification_status: VerificationStatus;
  parent_series_id?: string;
  franchise_id?: string;
  related_entry_ids: string[];
  modified_time?: string;
  last_metadata_refresh?: string;
  last_verified?: string;
  tag_ids: string[];
  developer_ids: string[];
  publisher_ids: string[];
  collection_ids: string[];
  created_at: string;
  updated_at: string;
  franchise?: {
    id: string;
    name: string;
  };
  parent_series?: ArchiveEntryReference;
  related_entries?: ArchiveEntryReference[];
}
