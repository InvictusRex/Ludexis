"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { jobsApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { toastError, toastSuccess } from "@/lib/toast";
import { buildPageQuery, DEFAULT_PAGE_SIZE, pageToOffset } from "@/lib/pagination";
import { PaginationControls } from "@/components/common/pagination-controls";
import { JobsReport } from "@/components/common/jobs-report";
import { BackgroundTaskAnalytics } from "@/components/common/background-task-analytics";
import type { JobHistory, JobStatus, JobType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Play, RefreshCw, XCircle } from "lucide-react";

const JOB_TYPES: JobType[] = [
  "LIBRARY_SCAN",
  "INCREMENTAL_SCAN",
  "METADATA_REFRESH",
  "ARTWORK_REFRESH",
  "DUPLICATE_DETECTION",
  "INTEGRITY_VERIFICATION",
];

const POLL_INTERVAL_MS = 5000;

const JOB_STATUSES: JobStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "CANCELED",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  RUNNING: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SUCCESS: "bg-green-500/15 text-green-600 border-green-500/30",
  FAILED: "bg-red-500/15 text-red-600 border-red-500/30",
  CANCELED: "bg-gray-500/15 text-gray-500 border-gray-500/30",
};

function humanizeJobType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function isActiveJob(job: JobHistory): boolean {
  return job.status === "PENDING" || job.status === "RUNNING";
}

function notifyStatusTransitions(
  previous: Map<string, JobStatus | undefined>,
  jobs: JobHistory[],
): void {
  for (const job of jobs) {
    const prevStatus = previous.get(job.id);
    if (!prevStatus || prevStatus === job.status) {
      continue;
    }
    const label = humanizeJobType(job.job_type);
    if (job.status === "SUCCESS") {
      toastSuccess(`Job ${label} completed`);
    } else if (job.status === "FAILED") {
      toastError(new Error("Job failed"), `Job ${label} failed`);
    }
  }
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<JobHistory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("ALL");
  const [startJobType, setStartJobType] = useState<JobType>(
    JOB_TYPES[0],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = DEFAULT_PAGE_SIZE;

  const previousStatusesRef = useRef<Map<string, JobStatus | undefined>>(
    new Map(),
  );

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const loadJobs = useCallback(
    async (showSpinner: boolean) => {
      if (authLoading || !user) {
        return;
      }

      if (showSpinner) {
        setLoading(true);
      }
      setError(null);
      try {
        const query = buildPageQuery(1, 100);
        const result = await jobsApi.getAll(
          jobTypeFilter === "ALL" ? undefined : (jobTypeFilter as JobType),
          statusFilter === "ALL" ? undefined : statusFilter,
          query.offset,
          query.limit,
        );
        notifyStatusTransitions(previousStatusesRef.current, result);
        previousStatusesRef.current = new Map(
          result.map((job) => [job.id, job.status]),
        );
        setJobs(result);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Failed to load jobs:", err);
        setError("Failed to load jobs. Please try again.");
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [authLoading, jobTypeFilter, statusFilter, user],
  );

  useEffect(() => {
    if (!authLoading) {
      loadJobs(true);
    }
  }, [authLoading, loadJobs]);

  const hasActiveJobs = jobs.some(isActiveJob);

  const totalJobs = jobs.length;
  const jobPageCount = Math.max(1, Math.ceil(totalJobs / PAGE_SIZE));
  const currentPage = Math.min(page, jobPageCount);
  const jobPageStart = pageToOffset(currentPage, PAGE_SIZE);
  const visibleJobs = jobs.slice(jobPageStart, jobPageStart + PAGE_SIZE);

  useEffect(() => {
    if (!hasActiveJobs) {
      return;
    }

    const intervalId = setInterval(() => {
      loadJobs(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [hasActiveJobs, loadJobs]);

  const refresh = () => {
    loadJobs(true);
  };

  const handleCancel = async (job: JobHistory) => {
    if (!job.id) {
      return;
    }
    if (!window.confirm(`Cancel job ${job.id}?`)) {
      return;
    }
    setCancelingId(job.id);
    try {
      await jobsApi.cancel(job.id);
      refresh();
    } catch (err) {
      console.error("Failed to cancel job:", err);
      setError("Failed to cancel job. Please try again.");
    } finally {
      setCancelingId(null);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      await jobsApi.start(startJobType);
      setStartJobType(JOB_TYPES[0]);
      refresh();
    } catch (err) {
      console.error("Failed to start job:", err);
      setError("Failed to start job. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-accent hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Job Center</h1>
        <p className="text-muted-foreground">
          Monitor and manage background jobs
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Filter jobs by status and job type
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status</p>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {JOB_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Job Type</p>
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Job Types</SelectItem>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {humanizeJobType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Start Job</CardTitle>
          <CardDescription>
            Queue a new background job
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Job Type</p>
            <Select
              value={startJobType}
              onValueChange={(value) => setStartJobType(value as JobType)}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {humanizeJobType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleStart}
            disabled={starting}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {starting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start Job
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Job History</CardTitle>
            <CardDescription>
              Recent background tasks and operations
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {hasActiveJobs && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Last updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-border"
              onClick={refresh}
              disabled={loading || authLoading || !user}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">
              No jobs found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-foreground">
                      {humanizeJobType(job.job_type)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_STYLES[job.status ?? ""] ??
                          "bg-gray-500/15 text-gray-500 border-gray-500/30"
                        }
                      >
                        {job.status ?? "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-36">
                        <Progress value={job.progress ?? 0} className="flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {job.progress ?? 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-48 truncate"
                      title={job.details}
                    >
                      {job.details ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {job.user_id ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(job.started_at)}</TableCell>
                    <TableCell>{formatDate(job.completed_at)}</TableCell>
                    <TableCell className="text-right">
                      {(job.status === "PENDING" ||
                        job.status === "RUNNING") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => handleCancel(job)}
                          disabled={cancelingId === job.id}
                        >
                          {cancelingId === job.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Cancel
                        </Button>
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
            total={totalJobs}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Reports &amp; Analytics
          </h2>
          <p className="text-muted-foreground text-sm">
            Historical reporting and background task distribution
          </p>
        </div>
        <JobsReport />
        <BackgroundTaskAnalytics />
      </div>
    </div>
  );
}
