import type { User } from "@/lib/types";

export type Permission =
  | "VIEW_LIBRARY"
  | "EDIT_METADATA"
  | "MANAGE_COLLECTIONS"
  | "MANAGE_USERS"
  | "RUN_SCANS"
  | "ACCESS_ADMIN"
  | "VIEW_AUDIT_LOGS";

// Mirrors the backend check: superusers pass everything, everyone else through their roles.
export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) {
    return false;
  }
  if (user.is_superuser) {
    return true;
  }
  return (
    user.roles?.some((role) =>
      role.permissions?.some((granted) => granted.name === permission),
    ) ?? false
  );
}

// The Admin Dashboard is for administrators; each section inside then checks its own permission.
export function canSeeDashboard(user: User | null | undefined): boolean {
  return can(user, "ACCESS_ADMIN");
}
