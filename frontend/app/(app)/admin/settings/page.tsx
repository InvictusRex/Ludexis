"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { SectionHeader } from "@/components/admin/common";
import { ServerSettingsForm } from "@/components/admin/server-settings-form";
import { config } from "@/lib/config";

export default function DashboardSettings() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "ACCESS_ADMIN");

  if (!can(user, "ACCESS_ADMIN")) {
    return null;
  }

  return (
    <div>
      <SectionHeader title="Settings" description="The server's name and where game details come from." />
      <ServerSettingsForm />
      <section aria-label="About" className="mt-10 flex items-center gap-4 border-t border-seam pt-6">
        <img src="/brand/knight.webp" alt="" width={579} height={565} className="w-11 shrink-0" />
        <div>
          <p className="font-display font-semibold tracking-[0.06em] text-parchment">Ludexis</p>
          <p className="text-sm tabular text-ash">Version {config.appVersion}</p>
        </div>
      </section>
    </div>
  );
}
