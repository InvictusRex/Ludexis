"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  jobsApi,
  scansApi,
  adminApi,
} from "@/lib/api";
import type {
  AdminStats,
  AuditLogRead,
  JobHistory,
  JobStatus,
  JobType,
  ScanStatus,
} from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { PaginationControls } from "@/components/common/pagination-controls";
import { UserAnalyticsDashboard } from "@/components/common/user-analytics-dashboard";
import { buildPageQuery, DEFAULT_PAGE_SIZE, pageToOffset } from "@/lib/pagination";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Loader2,
  PieChart as PieChartIcon,
  RefreshCw,
  ScrollText,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const JOB_TYPE_LABELS: Record<JobType, string> = {
  LIBRARY_SCAN: "Full Scan",
  INCREMENTAL_SCAN: "Incremental Scan",
  METADATA_REFRESH: "Metadata Refresh",
  ARTWORK_REFRESH: "Artwork Refresh",
  DUPLICATE_DETECTION: "Duplicate Detection",
  INTEGRITY_VERIFICATION: "Integrity Verification",
};

const JOB_TYPE_ORDER: JobType[] = [
  "LIBRARY_SCAN",
  "INCREMENTAL_SCAN",
  "METADATA_REFRESH",
  "ARTWORK_REFRESH",
  "DUPLICATE_DETECTION",
  "INTEGRITY_VERIFICATION",
];

const JOB_STATUS_ORDER: JobStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELED",
];

const STATUS_STYLES: Record<JobStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  RUNNING: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SUCCESS: "bg-green-500/15 text-green-600 border-green-500/30",
  FAILED: "bg-red-500/15 text-red-600 border-red-500/30",
  CANCELED: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

const STATUS_COLORS: Record<JobStatus, string> = {
  PENDING: "#f59e0b",
  RUNNING: "#3b82f6",
  SUCCESS: "#22c55e",
  FAILED: "#ef4444",
  CANCELED: "#6b7280",
};

const SCAN_CARDS: Array<{
  key: keyof ScanStatus;
  label: string;
  color: string;
}> = [
  { key: "pending", label: "Pending", color: "text-amber-500" },
  { key: "running", label: "Running", color: "text-blue-500" },
  { key: "success", label: "Success", color: "text-green-500" },
  { key: "failed", label: "Failed", color: "text-red-500" },
  { key: "canceled", label: "Canceled", color: "text-gray-500" },
];

const DETAILS_MAX_LENGTH = 100;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function actionBadgeClass(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("delete"))
    return "bg-red-500/15 text-red-500 border-red-500/50";
  if (lower.includes("create"))
    return "bg-green-500/15 text-green-500 border-green-500/50";
  if (lower.includes("update") || lower.includes("edit"))
    return "bg-blue-500/15 text-blue-500 border-blue-500/50";
  if (lower.includes("upload"))
    return "bg-purple-500/15 text-purple-500 border-purple-500/50";
  return "bg-accent/20 text-accent border-accent/50";
}

function truncateDetails(details: string): string {
  return details.length > DETAILS_MAX_LENGTH
    ? `${details.slice(0, DETAILS_MAX_LENGTH)}…`
    : details;
}

interface DashboardData {
  jobs: JobHistory[];
  scanStatus: ScanStatus;
  stats: AdminStats;
  auditLogs: AuditLogRead[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobsQuery = buildPageQuery(1, 500);
      const auditQuery = buildPageQuery(1, 200);
      const [jobs, scanStatus, stats, auditLogs] = await Promise.all([
        jobsApi.getAll(
          undefined,
          undefined,
          jobsQuery.offset,
          jobsQuery.limit,
        ),
        scansApi.getStatus(),
        adminApi.getStats(),
        adminApi.getAuditLogs({
          offset: auditQuery.offset,
          limit: auditQuery.limit,
        }),
      ]);
      setData({ jobs, scanStatus, stats, auditLogs });
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [authLoading, loadData]);

  const statusDistribution = useMemo(() => {
    const counts = new Map<JobStatus, number>();
    for (const job of data?.jobs ?? []) {
      const status: JobStatus = job.status ?? "PENDING";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return JOB_STATUS_ORDER.map((status) => ({
      name: status,
      value: counts.get(status) ?? 0,
    }));
  }, [data?.jobs]);

  const jobTypeBreakdown = useMemo(() => {
    const counts = new Map<JobType, number>();
    for (const job of data?.jobs ?? []) {
      counts.set(job.job_type, (counts.get(job.job_type) ?? 0) + 1);
    }
    return JOB_TYPE_ORDER.map((jobType) => ({
      name: JOB_TYPE_LABELS[jobType],
      count: counts.get(jobType) ?? 0,
    }));
  }, [data?.jobs]);

  const totalJobs = data?.jobs.length ?? 0;

  const totalAuditLogs = data?.auditLogs.length ?? 0;
  const auditPageCount = Math.max(1, Math.ceil(totalAuditLogs / PAGE_SIZE));
  const currentPage = Math.min(page, auditPageCount);
  const auditPageStart = pageToOffset(currentPage, PAGE_SIZE);
  const visibleAuditLogs = (data?.auditLogs ?? []).slice(
    auditPageStart,
    auditPageStart + PAGE_SIZE,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Job & System Analytics
          </h1>
          <p className="text-muted-foreground">
            Job history, scan activity, archive coverage, and recent actions
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading analytics data...
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit border-border"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Scan Progress Cards */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-accent" />
              Scan Progress
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {SCAN_CARDS.map((card) => (
                <Card key={card.key} className="border-border">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm mb-2">
                      {card.label}
                    </p>
                    <p className={`text-3xl font-bold ${card.color}`}>
                      {data.scanStatus[card.key]}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm mb-2">Total</p>
                  <p className="text-3xl font-bold text-accent">
                    {data.scanStatus.total}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Job Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Job Status Distribution */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Job Status Distribution
                </CardTitle>
                <CardDescription>
                  All recorded jobs by final status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalJobs === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No job history available yet.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution.filter((s) => s.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {statusDistribution.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={STATUS_COLORS[entry.name as JobStatus]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Type Breakdown */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Job Type Breakdown
                </CardTitle>
                <CardDescription>
                  Number of jobs by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalJobs === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No job history available yet.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={jobTypeBreakdown}>
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Jobs"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Archive Coverage */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Archive Coverage
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm mb-2">
                    Archive Entries
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {data.stats.archive_entries}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm mb-2">
                    Collections
                  </p>
                  <p className="text-3xl font-bold text-accent">
                    {data.stats.collections}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm mb-2">Users</p>
                  <p className="text-3xl font-bold text-accent">
                    {data.stats.users}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Metadata Coverage
                    </span>
                    <span className="text-sm font-semibold text-green-500">
                      {Math.round(data.stats.metadata_coverage)}%
                    </span>
                  </div>
                  <Progress value={data.stats.metadata_coverage} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Verification Coverage
                    </span>
                    <span className="text-sm font-semibold text-blue-500">
                      {Math.round(data.stats.verification_coverage)}%
                    </span>
                  </div>
                  <Progress value={data.stats.verification_coverage} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Analytics */}
          <UserAnalyticsDashboard />

          {/* Recent User Activity */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent User Activity
              </CardTitle>
              <CardDescription>
                Latest actions recorded across the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.auditLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No audit logs found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleAuditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={actionBadgeClass(log.action)}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {log.entity}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {log.user_id ?? "system"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[320px]">
                          {log.details ? (
                            <span
                              className="block truncate"
                              title={log.details}
                            >
                              {truncateDetails(log.details)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <PaginationControls
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={totalAuditLogs}
                onPageChange={setPage}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
