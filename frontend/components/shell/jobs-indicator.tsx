"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { jobsApi } from "@/lib/api";
import type { JobHistory } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { jobLabel } from "./job-labels";

const BUSY_POLL_MS = 4000;
const IDLE_POLL_MS = 30000;

/** Ask the indicator to look for jobs now, e.g. right after starting one. */
export function announceJobsChanged() {
  window.dispatchEvent(new Event("ludexis:jobs-changed"));
}

/** Running jobs, polled quickly while something runs and slowly otherwise. */
export function JobsIndicator() {
  const [running, setRunning] = useState<JobHistory[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    const check = async () => {
      clearTimeout(timer);
      let busy = false;
      try {
        const jobs = await jobsApi.getAll(undefined, "RUNNING", 0, 20);
        busy = jobs.length > 0;
        if (!stopped) setRunning(jobs);
      } catch {
        // A failed poll leaves the last known state; the next one tries again.
      }
      if (!stopped) timer = setTimeout(check, busy ? BUSY_POLL_MS : IDLE_POLL_MS);
    };

    check();
    window.addEventListener("ludexis:jobs-changed", check);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("ludexis:jobs-changed", check);
    };
  }, []);

  const busy = running.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={busy ? `${running.length} running tasks` : "Tasks"}
        className="relative grid size-9 place-items-center rounded-full text-ash outline-none hover:bg-stone hover:text-parchment focus-visible:ring-2 focus-visible:ring-violet-lit"
      >
        <Activity className={cn("size-[18px]", busy && "text-violet-lit")} />
        {busy && (
          <span aria-hidden="true" className="absolute right-1.5 top-1.5 size-2 rounded-full bg-violet-lit motion-safe:animate-pulse" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold text-parchment">
          {busy ? "Running now" : "Nothing running"}
        </p>
        {running.map((job) => (
          <div key={job.id} className="rounded-md px-2 py-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-parchment">{jobLabel(job.job_type)}</span>
              <span className="tabular text-ash">{Math.round(job.progress ?? 0)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-seam">
              <div
                className="h-full rounded-full bg-violet-lit transition-[width] duration-500"
                style={{ width: `${Math.max(2, job.progress ?? 0)}%` }}
              />
            </div>
          </div>
        ))}
        <DropdownMenuItem asChild className="mt-1">
          <Link href="/admin/tasks">View all tasks</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
