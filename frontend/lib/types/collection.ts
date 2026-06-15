export interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_path?: string | null;
  banner_path?: string | null;
  visibility?: string;
  entry_ids: string[];
}
