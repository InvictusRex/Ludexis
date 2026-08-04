"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { AuditLogRead } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTIVITY_LIMIT = 50;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function actionBadgeClass(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("failure"))
    return "bg-red-500/15 text-red-500 border-red-500/50";
  if (lower.includes("login"))
    return "bg-green-500/15 text-green-500 border-green-500/50";
  if (lower.includes("logout"))
    return "bg-gray-500/15 text-gray-500 border-gray-500/50";
  if (lower.includes("delete") || lower.includes("remove"))
    return "bg-red-500/15 text-red-500 border-red-500/50";
  if (lower.includes("create"))
    return "bg-blue-500/15 text-blue-500 border-blue-500/50";
  return "bg-accent/20 text-accent border-accent/50";
}

export function AccountActivityList({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<AuditLogRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await adminApi.getAuditLogs({
        user_id: userId,
        limit: ACTIVITY_LIMIT,
      });
      setLogs(result);
    } catch (err) {
      toastError(err, "Failed to load account activity.");
      setError("Failed to load account activity. Please try again.");
      setLogs([]);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

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
          <Skeleton className="h-4 w-48" />
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
              <History className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No recent account activity</EmptyTitle>
            <EmptyDescription>
              Sign-ins and changes you make will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
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
              <TableCell className="text-foreground">{log.entity}</TableCell>
              <TableCell className="text-muted-foreground max-w-[320px]">
                {log.details ? (
                  <span className="block truncate" title={log.details}>
                    {log.details}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Account Activity
        </CardTitle>
        <CardDescription>
          Your most recent sign-ins and audited actions
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
