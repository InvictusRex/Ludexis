export interface AdminStats {
  archive_entries: number;
  collections: number;
  tags: number;
  developers: number;
  publishers: number;
  franchises: number;
  users: number;
  metadata_coverage: number;
  verification_coverage: number;
}

export interface AuditLogRead {
  user_id?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  details?: string | null;
  id: string;
  created_at: string;
}

export type PermissionReport = Record<string, string[]>;

export interface AuditLogQuery {
  user_id?: string;
  entity?: string;
  action?: string;
  offset?: number;
  limit?: number;
}
