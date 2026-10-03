export interface LibraryRead {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  status?: "ONLINE" | "OFFLINE";
  last_seen_at?: string | null;
  last_scan_at?: string | null;
  last_error?: string | null;
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
