import type { PermissionRead } from "./permission";

export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  /** Sees games marked restricted. */
  allow_restricted?: boolean;
  /** Games in these collections are hidden from the user. */
  blocked_collection_ids?: string[];
  created_at?: string;
  /** The default administrator must choose a new password before anything else. */
  must_change_password?: boolean;
  roles?: Array<{ id: string; name: string; permissions?: PermissionRead[] }>;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role_ids?: string[];
}

export interface UserUpdate {
  username?: string | null;
  email?: string | null;
  password?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  role_ids?: string[] | null;
  allow_restricted?: boolean | null;
  blocked_collection_ids?: string[] | null;
}

export interface PasswordResetRequest {
  password: string;
}
