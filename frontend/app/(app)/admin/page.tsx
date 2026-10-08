"use client";

import { useEffect } from "react";
import Link from "next/link";
import { adminApi, archiveApi, artworkApi, healthApi, jobMonitorApi, jobsApi, scansApi } from "@/lib/api";
import type { AdminStats, HealthStatus, JobHistory, JobMonitorStats, JobMonitorWorker, ScanStatus } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { can } from "@/lib/permissions";
import { plural } from "@/lib/format";
import { loadReviewCount } from "@/hooks/use-review-count";
import { AlertDot } from "@/components/shell/nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { jobLabel } from "@/components/shell/job-labels";
import { JobStatus, SectionHeader, Status, dateTime } from "@/components/admin/common";
import { ScanButtons } from "@/components/admin/scan-buttons";

const POLL_MS = 5000;

const HEALTHY = new Set(["healthy", "ok", "pong"]);
const healthy = (value?: string) => HEALTHY.has(value?.toLowerCase() ?? "");

async function loadHealth() {
  const [api, db, redis] = await Promise.allSettled([healthApi.getHealth(), healthApi.getDb(), healthApi.getRedis()]);
  const value = (result: PromiseSettledResult<HealthStatus>, key: keyof HealthStatus) =>
    result.status === "fulfilled" ? result.value[key] : undefined;
  return [
    { name: "API", ok: healthy(value(api, "status")) },
    { name: "Database", ok: healthy(value(db, "database")) },
    { name: "Redis", ok: healthy(value(redis, "redis")) },
  ];
}

interface ServerInfo {
  stats?: AdminStats;
  queue?: JobMonitorStats;
  workers?: JobMonitorWorker;
  scans?: ScanStatus;
}

async function loadServer(): Promise<ServerInfo> {
  const [stats, queue, workers, scans] = await Promise.allSettled([
    adminApi.getStats(),
    jobMonitorApi.getStats(),
    jobMonitorApi.getWorkers(),
    scansApi.getStatus(),
  ]);
  const ok = <T,>(result: PromiseSettledResult<T>) => (result.status === "fulfilled" ? result.value : undefined);
  if (stats.status === "rejected") {
    throw stats.reason;
  }
  return { stats: stats.value, queue: ok(queue), workers: ok(workers), scans: ok(scans) };
}

async function loadJobs() {
  const [running, recent] = await Promise.all([
    jobsApi.getAll(undefined, "RUNNING", 0, 20),
    jobsApi.getAll(undefined, undefined, 0, 8),
  ]);
  return { running, recent };
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const isAdmin = can(user, "ACCESS_ADMIN");
  const canScan = can(user, "RUN_SCANS");

  const health = useApi(loadHealth, []);
  const server = useApi(() => (isAdmin ? loadServer() : Promise.resolve(null)), [isAdmin]);
  const jobs = useApi(loadJobs, []);

  const busy = (jobs.data?.running.length ?? 0) > 0;
  const reloadJobs = jobs.reload;
  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(reloadJobs, POLL_MS);
    return () => clearInterval(timer);
  }, [busy, reloadJobs]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Overview"
        description="Server health, what the library holds and what is running now."
        actions={
          canScan && <ScanButtons onStarted={reloadJobs} />
        }
      />

      {can(user, "EDIT_METADATA") && <NeedsAttention />}

      {isAdmin && (
        <LibraryStats
          stats={server.data?.stats}
          loading={server.loading}
          failed={Boolean(server.error)}
          onRetry={server.reload}
          canReview={can(user, "EDIT_METADATA")}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Activity jobs={jobs.data} loading={jobs.loading && !jobs.data} failed={Boolean(jobs.error)} onRetry={jobs.reload} />
        <ServerCard health={health.data} server={server.data ?? undefined} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

/** What waits for an editor, each opening the matching Metadata tab; only the review queue raises a red dot. */
function NeedsAttention() {
  const counts = useApi(async () => {
    const [review, missing, duplicates] = await Promise.all([
      loadReviewCount(),
      // these two endpoints return full lists (no paging or count header); fine at homelab scale.
      artworkApi.getMissing(),
      archiveApi.getDuplicates(),
    ]);
    return [
      { href: "/admin/metadata?tab=review", label: `${plural(review, "game")} to identify`, count: review, alert: true },
      { href: "/admin/metadata?tab=artwork", label: `${plural(missing.length, "game")} missing artwork`, count: missing.length },
      { href: "/admin/metadata?tab=duplicates", label: plural(duplicates.length, "duplicate group"), count: duplicates.length },
    ].filter((item) => item.count > 0);
  }, []);

  if (!counts.data?.length) {
    return null;
  }
  return (
    <section
      aria-label="Needs attention"
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-seam bg-vault px-4 py-3 text-sm"
    >
      <span className="font-medium text-parchment">Needs attention</span>
      {counts.data.map((item) => (
        <Link key={item.href} href={item.href} className="flex items-center gap-2 tabular text-violet-lit hover:text-parchment">
          {item.alert && <AlertDot />}
          {item.label}
        </Link>
      ))}
    </section>
  );
}

function LibraryStats({
  stats,
  loading,
  failed,
  onRetry,
  canReview,
}: {
  stats?: AdminStats;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  canReview: boolean;
}) {
  if (failed) {
    return (
      <Card className="flex-row items-center justify-between px-5">
        <p className="text-sm text-ash">Library totals could not be loaded.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }

  const tiles: [string, number | undefined][] = [
    ["Games", stats?.archive_entries],
    ["Collections", stats?.collections],
    ["Developers", stats?.developers],
    ["Publishers", stats?.publishers],
    ["Franchises", stats?.franchises],
    ["Tags", stats?.tags],
    ["Users", stats?.users],
  ];

  return (
    <Card data-mask className="gap-0 py-0">
      <dl className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map(([label, value]) => (
          <div key={label} className="border-b border-seam px-5 py-4 lg:border-b-0 lg:border-r lg:last:border-r-0">
            <dt className="text-sm text-ash">{label}</dt>
            <dd className="tabular mt-1 text-2xl font-semibold text-parchment">
              {loading && !stats ? <Skeleton className="h-7 w-12" /> : (value?.toLocaleString() ?? "—")}
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-5 border-t border-seam px-5 py-4 sm:grid-cols-2">
        <Coverage label="Games identified" value={stats?.metadata_coverage}>
          {canReview && stats && stats.metadata_coverage < 100 && (
            <Link href="/admin/metadata?tab=review" className="text-violet-lit hover:underline">
              Review
            </Link>
          )}
        </Coverage>
        <Coverage label="Files checked" value={stats?.verification_coverage} />
      </div>
    </Card>
  );
}

function Coverage({ label, value, children }: { label: string; value?: number; children?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-ash">{label}</span>
        <span className="flex items-center gap-3">
          {children}
          <span className="tabular font-medium text-parchment">{value == null ? "—" : `${Math.round(value)}%`}</span>
        </span>
      </div>
      <Progress value={value ?? 0} aria-label={label} className="h-1.5 bg-seam" />
    </div>
  );
}

function Activity({
  jobs,
  loading,
  failed,
  onRetry,
}: {
  jobs?: { running: JobHistory[]; recent: JobHistory[] };
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const runningIds = new Set(jobs?.running.map((job) => job.id));
  const recent = jobs?.recent.filter((job) => !runningIds.has(job.id)) ?? [];

  return (
    <Card className="min-w-0">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Activity</CardTitle>
        <Link href="/admin/tasks?tab=jobs" className="text-sm text-violet-lit hover:underline">
          View all jobs
        </Link>
      </CardHeader>
      <CardContent data-mask className="space-y-6">
        {failed ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ash">Jobs could not be loaded.</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((key) => (
              <Skeleton key={key} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            {jobs && jobs.running.length > 0 && (
              <section aria-label="Running now" className="space-y-4">
                {jobs.running.map((job) => (
                  <div key={job.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-parchment">{jobLabel(job.job_type)}</span>
                      <span className="tabular text-ash">{Math.round(job.progress ?? 0)}%</span>
                    </div>
                    <Progress value={job.progress ?? 0} aria-label={`${jobLabel(job.job_type)} progress`} className="h-1.5 bg-seam" />
                    {job.details && <p className="mt-1.5 truncate text-xs text-ash">{job.details}</p>}
                  </div>
                ))}
              </section>
            )}
            {jobs && jobs.running.length === 0 && (
              <div className="flex items-center gap-4 rounded-lg bg-night/40 p-3">
                <img src="/brand/knight.webp" alt="" width={579} height={565} className="w-12 shrink-0 opacity-80" />
                <div>
                  <p className="font-display font-semibold text-parchment">All quiet in the keep</p>
                  <p className="text-sm text-ash">Nothing is running right now.</p>
                </div>
              </div>
            )}
            {recent.length === 0 && !jobs?.running.length ? (
              <p className="text-sm text-ash">Nothing has run yet. Start a scan to fill the library.</p>
            ) : (
              <ul aria-label="Recent jobs" className="divide-y divide-seam">
                {recent.map((job) => (
                  <li key={job.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                    <span className="min-w-0 truncate text-sm text-parchment">{jobLabel(job.job_type)}</span>
                    <span className="flex items-center gap-4">
                      <span className="tabular text-xs text-ash">{dateTime(job.completed_at ?? job.started_at)}</span>
                      <JobStatus status={job.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ServerCard({
  health,
  server,
  isAdmin,
}: {
  health?: { name: string; ok: boolean }[];
  server?: ServerInfo;
  isAdmin: boolean;
}) {
  const workers = server?.workers ? Object.entries(server.workers) : undefined;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Server</CardTitle>
      </CardHeader>
      <CardContent data-mask className="space-y-5 text-sm">
        <ul aria-label="Services" className="space-y-2.5">
          {(health ?? [{ name: "API" }, { name: "Database" }, { name: "Redis" }]).map((service) => (
            <li key={service.name} className="flex items-center justify-between gap-3">
              <span className="text-ash">{service.name}</span>
              {"ok" in service ? (
                <Status tone={service.ok ? "ok" : "bad"}>{service.ok ? "Healthy" : "Unreachable"}</Status>
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <div className="space-y-2.5 border-t border-seam pt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ash">Workers</span>
              <span className="tabular text-parchment">
                {server?.queue
                  ? `${server.queue.workers} online · ${server.queue.active_tasks} active · ${server.queue.reserved_tasks} queued`
                  : "—"}
              </span>
            </div>
            {workers?.length === 0 && <Status tone="bad">No workers connected</Status>}
            {workers?.map(([name, info]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-xs text-ash" title={name}>
                  {name}
                </span>
                <Status tone={healthy(info.ok) ? "ok" : "bad"}>{healthy(info.ok) ? "Online" : "Not responding"}</Status>
              </div>
            ))}
          </div>
        )}

        {server?.scans && (
          <div className="flex items-center justify-between gap-3 border-t border-seam pt-4">
            <span className="text-ash">Scans so far</span>
            <span className="tabular text-parchment">
              {server.scans.success.toLocaleString()} done · {server.scans.failed.toLocaleString()} failed
            </span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
