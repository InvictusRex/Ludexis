import type { PermissionRead } from "./permission";

export interface RoleRead {
  id: string;
  name: string;
  description?: string | null;
  permissions: PermissionRead[];
}

export interface RoleCreate {
  name: string;
  description?: string | null;
  permission_ids?: string[];
}

export interface RoleUpdate {
  name?: string | null;
  description?: string | null;
  permission_ids?: string[] | null;
}
