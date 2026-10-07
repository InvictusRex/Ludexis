"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, useTabParam } from "@/components/admin/common";
import { JobsPanel } from "@/components/admin/jobs-panel";
import { ScheduledTasks } from "@/components/admin/scheduled-tasks";

const TABS = ["scheduled", "jobs"] as const;

export default function DashboardTasks() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "RUN_SCANS");
  // Schedules are server settings, so they need admin access on top of running jobs.
  const canSchedule = can(user, "ACCESS_ADMIN");
  const [tab, setTab] = useTabParam(TABS, canSchedule ? "scheduled" : "jobs");

  if (!can(user, "RUN_SCANS")) {
    return null;
  }

  return (
    <div>
      <SectionHeader
        title="Tasks"
        description="Recurring jobs run on these schedules in the server's local time. Every scan and task lands in the job history."
      />
      <Tabs value={canSchedule ? tab : "jobs"} onValueChange={setTab} className="gap-6">
        <TabsList>
          {canSchedule && <TabsTrigger value="scheduled">Scheduled</TabsTrigger>}
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>
        {canSchedule && (
          <TabsContent value="scheduled">
            <ScheduledTasks />
          </TabsContent>
        )}
        <TabsContent value="jobs">
          <JobsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
