export interface Publisher {
  id: string;
  name: string;
  description?: string;
  website?: string | null;
  entry_count: number;
}

export interface PublisherCreate {
  name: string;
  description?: string | null;
  website?: string | null;
}

export type PublisherUpdate = Partial<PublisherCreate>;
