"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { jobsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { JobHistory, JobStatus, JobType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const JOB_TYPES: JobType[] = [
  "LIBRARY_SCAN",
  "INCREMENTAL_SCAN",
  "METADATA_REFRESH",
  "ARTWORK_REFRESH",
  "DUPLICATE_DETECTION",
  "INTEGRITY_VERIFICATION",
];

const STATUS_ORDER: JobStatus[] = [
  "SUCCESS",
  "FAILED",
  "CANCELED",
  "RUNNING",
  "PENDING",
];

const STATUS_BAR_STYLES: Record<string, string> = {
  SUCCESS: "[&_[data-slot=progress-indicator]]:bg-green-500",
  FAILED: "[&_[data-slot=progress-indicator]]:bg-red-500",
  CANCELED: "[&_[data-slot=progress-indicator]]:bg-gray-400",
  RUNNING: "[&_[data-slot=progress-indicator]]:bg-blue-500",
  PENDING: "[&_[data-slot=progress-indicator]]:bg-amber-500",
};

function humanizeJobType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function durationMs(job: JobHistory): number | null {
  if (!job.started_at || !job.completed_at) {
    return null;
  }
  const start = new Date(job.started_at).getTime();
  const end = new Date(job.completed_at).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return null;
  }
  return end - start;
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0
    ? `${days}d ${remainingHours}h`
    : `${days}d`;
}

function averageDurationMs(jobs: JobHistory[]): number | null {
  const durations = jobs
    .map(durationMs)
    .filter((value): value is number => value !== null);
  if (durations.length === 0) return null;
  return durations.reduce((sum, value) => sum + value, 0) / durations.length;
}

function medianDurationMs(jobs: JobHistory[]): number | null {
  const durations = jobs
    .map(durationMs)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);
  if (durations.length === 0) return null;
  const middle = Math.floor(durations.length / 2);
  if (durations.length % 2 === 1) {
    return durations[middle];
  }
  return (durations[middle - 1] + durations[middle]) / 2;
}

export function JobsReport() {
  const [jobs, setJobs] = useState<JobHistory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setError(null);
    try {
      const result = await jobsApi.getAll(undefined, undefined, 0, 500);
      setJobs(result);
    } catch (err) {
      toastError(err, "Failed to load job report.");
      setError("Failed to load job report. Please try again.");
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const stats = useMemo(() => {
    const list = jobs ?? [];
    const total = list.length;
    const byStatus = STATUS_ORDER.reduce<Record<string, number>>(
      (acc, status) => {
        acc[status] = 0;
        return acc;
      },
      {},
    );
    for (const job of list) {
      const status = job.status ?? "PENDING";
      byStatus[status] = (byStatus[status] ?? 0) + 1;
    }
    const terminal =
      (byStatus.SUCCESS ?? 0) +
      (byStatus.FAILED ?? 0) +
      (byStatus.CANCELED ?? 0);
    const finishedJobs = list.filter(
      (job) =>
        job.status !== "PENDING" &&
        job.status !== "RUNNING" &&
        job.started_at &&
        job.completed_at,
    );
    const byType = JOB_TYPES.map((type) => {
      const typeJobs = list.filter((job) => job.job_type === type);
      return {
        type,
        count: typeJobs.length,
        avgDuration: averageDurationMs(typeJobs),
      };
    }).filter((entry) => entry.count > 0);
    return {
      total,
      byStatus,
      completionRate:
        total === 0 ? 0 : Math.round((terminal / total) * 100),
      averageDuration: averageDurationMs(finishedJobs),
      medianDuration: medianDurationMs(finishedJobs),
      byType,
    };
  }, [jobs]);

  const renderBody = () => {
    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={loadJobs}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }
    if (jobs === null) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }
    if (jobs.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RefreshCw className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No job history available</EmptyTitle>
            <EmptyDescription>
              Run a background job to start collecting reporting data.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-bold text-foreground">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <div className="flex items-center gap-2 pt-1">
              <Progress value={stats.completionRate} className="flex-1" />
              <span className="text-sm font-medium text-foreground w-10 text-right">
                {stats.completionRate}%
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">
              Avg Duration (Finished)
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats.averageDuration === null
                ? "—"
                : formatDuration(stats.averageDuration)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">
              Median Duration (Finished)
            </p>
            <p className="text-2xl font-bold text-foreground">
              {stats.medianDuration === null
                ? "—"
                : formatDuration(stats.medianDuration)}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Success / Failure Rates
          </p>
          {STATUS_ORDER.map((status) => {
            const count = stats.byStatus[status] ?? 0;
            const percent =
              stats.total === 0
                ? 0
                : Math.round((count / stats.total) * 100);
            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{status}</span>
                  <span className="font-medium text-foreground">
                    {count} · {percent}%
                  </span>
                </div>
                <Progress
                  value={percent}
                  className={cn("h-2", STATUS_BAR_STYLES[status])}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-foreground mb-2">
            By Job Type
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Type</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.byType.map((entry) => (
                <TableRow key={entry.type}>
                  <TableCell className="font-medium text-foreground">
                    {humanizeJobType(entry.type)}
                  </TableCell>
                  <TableCell>{entry.count}</TableCell>
                  <TableCell>
                    {entry.avgDuration === null
                      ? "—"
                      : formatDuration(entry.avgDuration)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Historical Job Report</CardTitle>
        <CardDescription>
          Success, failure, and duration statistics across all recorded jobs
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
