"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, useTabParam } from "@/components/admin/common";
import { RolesPanel } from "@/components/admin/roles-panel";
import { UsersPanel } from "@/components/admin/users-panel";

const TABS = ["users", "roles"] as const;

export default function DashboardUsers() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "MANAGE_USERS");
  const [tab, setTab] = useTabParam(TABS, "users");

  if (!can(user, "MANAGE_USERS")) {
    return null;
  }

  return (
    <div>
      <SectionHeader title="Users" description="Who can sign in, and what each of them may change." />
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
        <TabsContent value="roles">
          <RolesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
