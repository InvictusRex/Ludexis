export interface LibraryRead {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LibraryCreate {
  name: string;
  path: string;
  enabled?: boolean;
}

export interface LibraryUpdate {
  name?: string | null;
  path?: string | null;
  enabled?: boolean | null;
}
