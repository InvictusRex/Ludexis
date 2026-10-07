"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { systemApi } from "@/lib/api";
import type { ScheduledTask, ScheduledTaskUpdate } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/brand/empty-state";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";
import { JobStatus, NativeSelect, dateTime } from "./common";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const pad = (value: number) => String(value).padStart(2, "0");

export function ScheduledTasks() {
  const tasks = useApi(() => systemApi.getScheduledTasks(), []);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const update = async (task: ScheduledTask, data: ScheduledTaskUpdate) => {
    setBusyKey(task.key);
    try {
      const updated = await systemApi.updateScheduledTask(task.key, data);
      tasks.setData((tasks.data ?? []).map((item) => (item.key === updated.key ? updated : item)));
    } catch (error) {
      toastError(error, "Could not update the task");
    } finally {
      setBusyKey(null);
    }
  };

  const runNow = async (task: ScheduledTask) => {
    setBusyKey(task.key);
    try {
      await systemApi.runScheduledTask(task.key);
      toastSuccess(`${task.name} started`);
      announceJobsChanged();
      tasks.reload();
    } catch (error) {
      toastError(error, "Could not start the task");
    } finally {
      setBusyKey(null);
    }
  };

  if (tasks.error) {
    return (
      <EmptyState
        title="Scheduled tasks could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={tasks.reload}>Try again</Button>}
      />
    );
  }

  if (!tasks.data) {
    return (
      <Card className="gap-3 px-5">
        {[0, 1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Task</TableHead>
            <TableHead>On</TableHead>
            <TableHead>Runs</TableHead>
            <TableHead>At</TableHead>
            <TableHead>Last run</TableHead>
            <TableHead>Next run</TableHead>
            <TableHead className="pr-5 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.data.map((task) => {
            const busy = busyKey === task.key;
            return (
              <TableRow key={task.key}>
                <TableCell className="py-3 pl-5 font-medium text-parchment">{task.name}</TableCell>
                <TableCell>
                  <Switch
                    aria-label={`Enable ${task.name}`}
                    checked={task.enabled}
                    disabled={busy}
                    onCheckedChange={(enabled) => update(task, { enabled })}
                  />
                </TableCell>
                <TableCell>
                  <NativeSelect
                    aria-label={`${task.name} frequency`}
                    value={task.day_of_week ?? -1}
                    disabled={busy}
                    onChange={(event) => update(task, { day_of_week: Number(event.target.value) })}
                  >
                    <option value={-1}>Every day</option>
                    {DAYS.map((day, index) => (
                      <option key={day} value={index}>
                        Every {day}
                      </option>
                    ))}
                  </NativeSelect>
                </TableCell>
                <TableCell>
                  <input
                    type="time"
                    aria-label={`${task.name} time`}
                    className="tabular h-9 rounded-md border border-seam bg-night/50 px-2 text-sm text-parchment outline-none [color-scheme:dark] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                    value={`${pad(task.hour)}:${pad(task.minute)}`}
                    disabled={busy}
                    onChange={(event) => {
                      const [hour, minute] = event.target.value.split(":").map(Number);
                      if (!Number.isNaN(hour) && !Number.isNaN(minute)) update(task, { hour, minute });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <JobStatus status={task.last_job_status} />
                    <p className="tabular text-xs text-ash">{dateTime(task.last_run_at)}</p>
                  </div>
                </TableCell>
                <TableCell className="tabular text-ash">{task.enabled ? dateTime(task.next_run_at) : "Off"}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => runNow(task)}>
                    <Play />
                    Run now
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
