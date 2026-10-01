export interface Tag {
  id: string;
  name: string;
  description?: string;
  color?: string | null;
  entry_count: number;
}

export interface TagCreate {
  name: string;
  description?: string | null;
  color?: string | null;
}

export type TagUpdate = Partial<TagCreate>;
