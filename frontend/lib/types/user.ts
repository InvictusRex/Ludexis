export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  roles?: Array<{ id: string; name: string }>;
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
}

export interface PasswordResetRequest {
  new_password: string;
}
