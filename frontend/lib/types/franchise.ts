export interface Franchise {
  id: string;
  name: string;
  description?: string;
  /** The image chosen for the franchise. */
  banner_path?: string | null;
  /** What to show: the chosen image, or a banner of one of its games. */
  image_path?: string | null;
  parent_id?: string | null;
  child_ids?: string[];
  entry_count: number;
}

export interface FranchiseCreate {
  name: string;
  description?: string | null;
  parent_id?: string | null;
}

export type FranchiseUpdate = Partial<FranchiseCreate>;
