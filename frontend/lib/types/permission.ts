export interface PermissionRead {
  id: string;
  name: string;
  description?: string | null;
}

export interface PermissionCreate {
  name: string;
  description?: string | null;
}
