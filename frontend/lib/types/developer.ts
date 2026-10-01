export interface Developer {
  id: string;
  name: string;
  description?: string;
  website?: string | null;
  entry_count: number;
}

export interface DeveloperCreate {
  name: string;
  description?: string | null;
  website?: string | null;
}

export type DeveloperUpdate = Partial<DeveloperCreate>;
