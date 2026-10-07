"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Play, X } from "lucide-react";
import { jobsApi } from "@/lib/api";
import type { JobHistory, JobType } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/brand/empty-state";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";
import { jobLabel } from "@/components/shell/job-labels";
import { JobStatus, NativeSelect, Pager, dateTime, isActiveJob, splitPage } from "./common";

const PAGE_SIZE = 25;
const POLL_MS = 5000;

const JOB_TYPES: JobType[] = [
  "INCREMENTAL_SCAN",
  "LIBRARY_SCAN",
  "METADATA_REFRESH",
  "ARTWORK_REFRESH",
  "DUPLICATE_DETECTION",
  "INTEGRITY_VERIFICATION",
];

const STATUSES: [string, string][] = [
  ["RUNNING", "Running"],
  ["PENDING", "Queued"],
  ["SUCCESS", "Done"],
  ["FAILED", "Failed"],
  ["CANCELED", "Canceled"],
];

export function JobsPanel() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const jobs = useApi(
    () =>
      jobsApi
        .getAll((type || undefined) as JobType | undefined, status || undefined, (page - 1) * PAGE_SIZE, PAGE_SIZE + 1)
        .then((rows) => splitPage(rows, PAGE_SIZE)),
    [status, type, page],
  );

  const active = jobs.data?.rows.some((job) => isActiveJob(job.status)) ?? false;
  const reload = jobs.reload;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(reload, POLL_MS);
    return () => clearInterval(timer);
  }, [active, reload]);

  const filter = (set: (value: string) => void) => (event: React.ChangeEvent<HTMLSelectElement>) => {
    set(event.target.value);
    setPage(1);
  };

  const start = async (jobType: JobType) => {
    try {
      await jobsApi.start(jobType);
      toastSuccess(`${jobLabel(jobType)} started`);
      announceJobsChanged();
      reload();
    } catch (error) {
      toastError(error, "Could not start the job");
    }
  };

  const cancel = async (job: JobHistory) => {
    if (!window.confirm(`Cancel ${jobLabel(job.job_type).toLowerCase()}?`)) return;
    setBusyId(job.id);
    try {
      await jobsApi.cancel(job.id);
      announceJobsChanged();
      reload();
    } catch (error) {
      toastError(error, "Could not cancel the job");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="job-status">Status</Label>
            <NativeSelect id="job-status" value={status} onChange={filter(setStatus)}>
              <option value="">Any status</option>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-type">Job</Label>
            <NativeSelect id="job-type" value={type} onChange={filter(setType)}>
              <option value="">Any job</option>
              {JOB_TYPES.map((value) => (
                <option key={value} value={value}>
                  {jobLabel(value)}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Play />
              Start job
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {JOB_TYPES.map((value) => (
              <DropdownMenuItem key={value} onSelect={() => start(value)}>
                {jobLabel(value)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {jobs.error ? (
        <EmptyState
          title="Jobs could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      ) : !jobs.data ? (
        <Card className="gap-3 px-5">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-10 w-full" />
          ))}
        </Card>
      ) : jobs.data.rows.length === 0 ? (
        <EmptyState
          title={status || type ? "No jobs match these filters" : "No jobs yet"}
          description={status || type ? "Try another status or job." : "Jobs appear here once a scan or task runs."}
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.data.rows.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="py-3 pl-5">
                    <p className="font-medium text-parchment">{jobLabel(job.job_type)}</p>
                    {job.details && (
                      <p className="max-w-72 truncate text-xs text-ash" title={job.details}>
                        {job.details}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <JobStatus status={job.status} />
                    {(job.retry_count ?? 0) > 0 && <p className="tabular text-xs text-ash">Retried {job.retry_count}×</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex w-36 items-center gap-2">
                      <Progress value={job.progress ?? 0} aria-label="Progress" className="h-1.5 flex-1 bg-seam" />
                      <span className="tabular w-9 text-right text-xs text-ash">{Math.round(job.progress ?? 0)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-ash">{dateTime(job.started_at)}</TableCell>
                  <TableCell className="tabular text-ash">{dateTime(job.completed_at)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    {isActiveJob(job.status) && (
                      <Button size="sm" variant="outline" disabled={busyId === job.id} onClick={() => cancel(job)}>
                        <X />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pager page={page} hasMore={jobs.data?.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
