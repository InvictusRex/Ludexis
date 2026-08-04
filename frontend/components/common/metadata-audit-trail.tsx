"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { AuditLogRead } from "@/lib/types";
import { cn } from "@/lib/utils";
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

const AUDIT_ENTITY = "ArchiveEntry";
const AUDIT_LIMIT = 100;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function dotClass(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("delete") || lower.includes("remove"))
    return "bg-red-500";
  if (lower.includes("create")) return "bg-green-500";
  if (lower.includes("override")) return "bg-purple-500";
  if (lower.includes("update")) return "bg-blue-500";
  return "bg-accent";
}

export function MetadataAuditTrail({ entryId }: { entryId: string }) {
  const [logs, setLogs] = useState<AuditLogRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await adminApi.getAuditLogs({
        entity: AUDIT_ENTITY,
        limit: AUDIT_LIMIT,
      });
      const scoped = data
        .filter((log) => log.entity_id === entryId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      setLogs(scoped);
    } catch (err) {
      toastError(err, "Failed to load metadata audit trail.");
      setError("Failed to load metadata audit trail. Please try again.");
      setLogs([]);
    }
  }, [entryId]);

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
          <Skeleton className="h-4 w-40" />
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
            <EmptyTitle>No metadata changes recorded</EmptyTitle>
            <EmptyDescription>
              Metadata edits and refreshes for this entry appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <ol className="relative space-y-6 pl-6">
        <span
          aria-hidden="true"
          className="absolute left-[0.3125rem] top-2 bottom-2 w-px bg-border"
        />
        {logs.map((log) => (
          <li key={log.id} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                dotClass(log.action),
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-accent/10 text-accent border-accent/30"
              >
                {log.action}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTimestamp(log.created_at)}
              </span>
              <span className="text-sm text-muted-foreground">
                by {log.user_id ?? "system"}
              </span>
            </div>
            {log.details && (
              <p className="text-sm text-muted-foreground mt-1">
                {log.details}
              </p>
            )}
          </li>
        ))}
      </ol>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5" />
          Metadata Audit Trail
        </CardTitle>
        <CardDescription>
          Chronological metadata changes recorded for this entry
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
