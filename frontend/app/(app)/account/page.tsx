"use client";

import { useAuth } from "@/contexts/auth-context";
import { can } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Page, PageHeader } from "@/components/shell/page";
import { AccountActivityList } from "@/components/common/account-activity-list";
import { AccountSecurityCard } from "@/components/common/account-security-card";
import { EffectivePermissionsPanel } from "@/components/common/effective-permissions-panel";

const CHIP = "rounded-full border border-seam bg-stone px-3 py-1 text-xs font-medium text-parchment";

export default function AccountPage() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  const roles = user.roles?.map((role) => role.name) ?? [];

  return (
    <Page>
      <PageHeader title="Account" description="Your profile, password and sessions, and what you can do in Ludexis." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <section aria-labelledby="profile-heading" className="rounded-lg border border-seam bg-vault p-5">
            <h2 id="profile-heading" className="sr-only">
              Profile
            </h2>
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-full bg-violet font-display text-2xl font-semibold text-white"
              >
                {user.username.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold text-parchment">{user.username}</p>
                <p className="truncate text-sm text-ash" data-mask>
                  {user.email}
                </p>
                {user.created_at && <p className="mt-1 text-xs text-ash">Member since {formatDate(user.created_at)}</p>}
              </div>
            </div>
            <div className="mt-5 border-t border-seam pt-4">
              <h3 className="text-sm font-medium text-ash">Roles</h3>
              {roles.length === 0 && !user.is_superuser ? (
                <p className="mt-2 text-sm text-ash">No roles yet. Ask an administrator to assign one.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {user.is_superuser && <li className={cn(CHIP, "border-violet-lit/40 text-violet-lit")}>Superuser</li>}
                  {roles.map((name) => (
                    <li key={name} className={CHIP}>
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <AccountSecurityCard />
        </div>
        <div className="space-y-6">
          <EffectivePermissionsPanel />
          {can(user, "VIEW_AUDIT_LOGS") && <AccountActivityList userId={user.id} />}
        </div>
      </div>
    </Page>
  );
}
