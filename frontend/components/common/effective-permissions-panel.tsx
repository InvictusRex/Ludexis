"use client";

import { Check, Minus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const GROUPS: { title: string; permissions: { name: string; label: string }[] }[] = [
  {
    title: "Library",
    permissions: [
      { name: "VIEW_LIBRARY", label: "Browse the library" },
      { name: "EDIT_METADATA", label: "Identify games and edit their details and artwork" },
      { name: "MANAGE_COLLECTIONS", label: "Create and edit collections" },
    ],
  },
  {
    title: "Admin Dashboard",
    permissions: [
      { name: "RUN_SCANS", label: "Run scans and background jobs" },
      { name: "ACCESS_ADMIN", label: "Manage libraries and server settings" },
      { name: "MANAGE_USERS", label: "Manage users and roles" },
      { name: "VIEW_AUDIT_LOGS", label: "Read the activity log" },
    ],
  },
];

const KNOWN = new Set(GROUPS.flatMap((group) => group.permissions.map((p) => p.name)));

/** What the signed-in user may do, read from the roles on their session. */
export function EffectivePermissionsPanel() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  const granted = new Map<string, string>();
  for (const role of user.roles ?? []) {
    for (const permission of role.permissions ?? []) {
      granted.set(permission.name, permission.description || permission.name);
    }
  }
  const has = (name: string) => user.is_superuser || granted.has(name);
  const other = [...granted].filter(([name]) => !KNOWN.has(name));

  const groups = other.length
    ? [...GROUPS, { title: "Other", permissions: other.map(([name, label]) => ({ name, label })) }]
    : GROUPS;

  return (
    <section aria-labelledby="permissions-heading" className="rounded-lg border border-seam bg-vault p-5">
      <h2 id="permissions-heading" className="text-lg font-semibold text-parchment">
        Permissions
      </h2>
      <p className="mt-1 text-sm text-ash">
        {user.is_superuser
          ? "You are a superuser, so every permission is granted."
          : "Granted by your roles. An administrator can change them."}
      </p>
      <div className="mt-5 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-medium text-ash">{group.title}</h3>
            <ul className="mt-2 space-y-2">
              {group.permissions.map(({ name, label }) => {
                const allowed = has(name);
                return (
                  <li key={name} className={cn("flex items-start gap-2.5 text-sm", allowed ? "text-parchment" : "text-ash/70")}>
                    {allowed ? (
                      <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-moss" />
                    ) : (
                      <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    )}
                    <span>
                      {label}
                      <span className="sr-only">{allowed ? " (allowed)" : " (not allowed)"}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
