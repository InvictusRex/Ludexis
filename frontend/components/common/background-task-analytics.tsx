"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { jobsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { JobHistory, JobStatus, JobType } from "@/lib/types";
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

function humanizeJobType(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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

export function BackgroundTaskAnalytics() {
  const [jobs, setJobs] = useState<JobHistory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setError(null);
    try {
      const result = await jobsApi.getAll(undefined, undefined, 0, 500);
      setJobs(result);
    } catch (err) {
      toastError(err, "Failed to load task analytics.");
      setError("Failed to load task analytics. Please try again.");
      setJobs([]);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const analytics = useMemo(() => {
    const list = jobs ?? [];
    const matrix = JOB_TYPES.map((type) => {
      const typeJobs = list.filter((job) => job.job_type === type);
      const counts = STATUS_ORDER.reduce<Record<string, number>>(
        (acc, status) => {
          acc[status] = typeJobs.filter((job) => job.status === status).length;
          return acc;
        },
        {},
      );
      return { type, counts, total: typeJobs.length };
    }).filter((row) => row.total > 0);

    let longestRunning: { job: JobHistory; duration: number } | null = null;
    for (const job of list) {
      const duration = durationMs(job);
      if (duration === null) continue;
      if (!longestRunning || duration > longestRunning.duration) {
        longestRunning = { job, duration };
      }
    }

    let mostRecentlyFinished: JobHistory | null = null;
    for (const job of list) {
      if (!job.completed_at) continue;
      const finishedAt = new Date(job.completed_at).getTime();
      if (Number.isNaN(finishedAt)) continue;
      if (
        !mostRecentlyFinished ||
        finishedAt > new Date(mostRecentlyFinished.completed_at ?? 0).getTime()
      ) {
        mostRecentlyFinished = job;
      }
    }

    return { matrix, longestRunning, mostRecentlyFinished };
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
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }
    if (jobs.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No background task data</EmptyTitle>
            <EmptyDescription>
              Task analytics appear once background jobs have been queued.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Type</TableHead>
              {STATUS_ORDER.map((status) => (
                <TableHead key={status} className="text-right">
                  {status}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.matrix.map((row) => (
              <TableRow key={row.type}>
                <TableCell className="font-medium text-foreground">
                  {humanizeJobType(row.type)}
                </TableCell>
                {STATUS_ORDER.map((status) => (
                  <TableCell key={status} className="text-right">
                    {row.counts[status] ?? 0}
                  </TableCell>
                ))}
                <TableCell className="text-right font-medium text-foreground">
                  {row.total}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Longest Running</p>
            {analytics.longestRunning ? (
              <>
                <p className="font-medium text-foreground">
                  {humanizeJobType(analytics.longestRunning.job.job_type)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDuration(analytics.longestRunning.duration)}
                </p>
              </>
            ) : (
              <p className="font-medium text-foreground">—</p>
            )}
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">
              Most Recently Finished
            </p>
            {analytics.mostRecentlyFinished ? (
              <>
                <p className="font-medium text-foreground">
                  {humanizeJobType(analytics.mostRecentlyFinished.job_type)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(analytics.mostRecentlyFinished.completed_at)}
                </p>
              </>
            ) : (
              <p className="font-medium text-foreground">—</p>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Background Task Analytics</CardTitle>
        <CardDescription>
          Job type and status distribution across background processing
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
