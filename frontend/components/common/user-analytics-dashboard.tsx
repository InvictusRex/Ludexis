"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { adminApi, usersApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { AuditLogRead, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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

const AUDIT_LIMIT = 500;
const USER_LIMIT = 200;
const TOP_USER_COUNT = 5;

const ACTION_GROUPS: Array<{ label: string; matches: (action: string) => boolean }> = [
  {
    label: "Authentication",
    matches: (action) =>
      action.startsWith("LOGIN") ||
      action === "LOGOUT" ||
      action === "TOKEN_REFRESH",
  },
  {
    label: "Create",
    matches: (action) => action.toLowerCase().includes("create"),
  },
  {
    label: "Update",
    matches: (action) =>
      action.toLowerCase().includes("update") ||
      action.toLowerCase().includes("override") ||
      action.toLowerCase().includes("assign"),
  },
  {
    label: "Delete",
    matches: (action) =>
      action.toLowerCase().includes("delete") ||
      action.toLowerCase().includes("remove"),
  },
  {
    label: "Scans",
    matches: (action) => action.includes("SCAN"),
  },
];

function formatTimestamp(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function classifyAction(action: string): string {
  const group = ACTION_GROUPS.find((entry) => entry.matches(action));
  return group?.label ?? "Other";
}

export function UserAnalyticsDashboard() {
  const [logs, setLogs] = useState<AuditLogRead[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [auditLogs, userList] = await Promise.all([
        adminApi.getAuditLogs({ limit: AUDIT_LIMIT }),
        usersApi.getAll(0, USER_LIMIT),
      ]);
      setLogs(auditLogs);
      setUsers(userList);
    } catch (err) {
      toastError(err, "Failed to load user analytics.");
      setError("Failed to load user analytics. Please try again.");
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useMemo(() => {
    const list = logs ?? [];
    const usersById = new Map(users.map((user) => [user.id, user]));

    const perUser = new Map<
      string,
      { userId: string; count: number; lastActivity: string | null }
    >();
    for (const log of list) {
      const key = log.user_id ?? "system";
      const existing = perUser.get(key);
      const currentTime = log.created_at;
      if (!existing) {
        perUser.set(key, {
          userId: key,
          count: 1,
          lastActivity: currentTime ?? null,
        });
        continue;
      }
      existing.count += 1;
      if (
        currentTime &&
        (!existing.lastActivity ||
          new Date(currentTime).getTime() >
            new Date(existing.lastActivity).getTime())
      ) {
        existing.lastActivity = currentTime;
      }
    }

    const ranked = Array.from(perUser.values())
      .map((entry) => ({
        ...entry,
        username:
          entry.userId === "system"
            ? "system"
            : usersById.get(entry.userId)?.username ?? entry.userId,
      }))
      .sort((a, b) => b.count - a.count);

    const groupCounts = new Map<string, number>();
    for (const log of list) {
      const group = classifyAction(log.action);
      groupCounts.set(group, (groupCounts.get(group) ?? 0) + 1);
    }
    const distribution = Array.from(groupCounts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percent: list.length === 0 ? 0 : Math.round((count / list.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents: list.length,
      ranked,
      topUsers: ranked.slice(0, TOP_USER_COUNT),
      distribution,
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.is_active).length,
      inactiveUsers: users.filter((user) => !user.is_active).length,
    };
  }, [logs, users]);

  const renderBody = () => {
    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={load}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }
    if (logs === null) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }
    if (logs.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No user activity recorded</EmptyTitle>
            <EmptyDescription>
              Analytics populate once users start performing audited actions.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Recorded Events</p>
            <p className="text-2xl font-bold text-foreground">
              {analytics.totalEvents}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground">
              {analytics.totalUsers}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {analytics.activeUsers}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Inactive Users</p>
            <p className="text-2xl font-bold text-amber-600">
              {analytics.inactiveUsers}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-foreground mb-2">
            Top Active Users
          </p>
          <div className="flex flex-wrap gap-2">
            {analytics.topUsers.map((entry, index) => (
              <Badge
                key={entry.userId}
                variant="outline"
                className="bg-accent/10 text-accent border-accent/30"
              >
                #{index + 1} {entry.username} · {entry.count}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Action Distribution
          </p>
          {analytics.distribution.map((entry) => (
            <div key={entry.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{entry.label}</span>
                <span className="font-medium text-foreground">
                  {entry.count} · {entry.percent}%
                </span>
              </div>
              <Progress value={entry.percent} className="h-2" />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-foreground mb-2">
            Per-User Activity
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total Actions</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.ranked.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell className="font-medium text-foreground">
                    {entry.username}
                  </TableCell>
                  <TableCell className="text-right">{entry.count}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTimestamp(entry.lastActivity)}
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          User Analytics
        </CardTitle>
        <CardDescription>
          Activity ranking and action distribution across audited events
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
