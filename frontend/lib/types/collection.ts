export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  cover_path?: string | null;
  banner_path?: string | null;
  visibility?: string;
  entry_ids: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CollectionCreate {
  name: string;
  description?: string | null;
  cover_path?: string | null;
  banner_path?: string | null;
  visibility?: string;
  entry_ids?: string[];
}

export interface CollectionUpdate {
  name?: string | null;
  description?: string | null;
  cover_path?: string | null;
  banner_path?: string | null;
  visibility?: string | null;
  entry_ids?: string[] | null;
}
