export interface Franchise {
  id: string;
  name: string;
  description?: string;
  banner_path?: string | null;
  parent_id?: string | null;
  child_ids?: string[];
  entry_count: number;
}
