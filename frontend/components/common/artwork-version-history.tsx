"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { ArchiveEntry, AuditLogRead, Screenshot } from "@/lib/types";
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

const AUDIT_ENTITY = "ArchiveEntry";
const AUDIT_LIMIT = 100;

interface ArtworkVersion {
  key: string;
  label: string;
  path: string;
  recordedAt: string | null;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function relativeTime(value: string | null, now: number): string {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ArtworkVersionHistory({
  entry,
  screenshots = [],
}: {
  entry: ArchiveEntry;
  screenshots?: Screenshot[];
}) {
  const [logs, setLogs] = useState<AuditLogRead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await adminApi.getAuditLogs({
        entity: AUDIT_ENTITY,
        limit: AUDIT_LIMIT,
      });
      setLogs(data.filter((log) => log.entity_id === entry.id));
    } catch (err) {
      toastError(err, "Failed to load artwork history.");
      setError("Failed to load artwork history. Please try again.");
      setLogs([]);
    }
  }, [entry.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setNow(Date.now());
  }, [logs]);

  const versions = useMemo<ArtworkVersion[]>(() => {
    const latestChange =
      (logs ?? [])
        .map((log) => log.created_at)
        .filter(Boolean)
        .sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        )[0] ?? entry.updated_at ?? null;

    const assets: ArtworkVersion[] = [];
    if (entry.cover_path) {
      assets.push({
        key: "cover",
        label: "Cover",
        path: entry.cover_path,
        recordedAt: latestChange,
      });
    }
    if (entry.banner_path) {
      assets.push({
        key: "banner",
        label: "Banner",
        path: entry.banner_path,
        recordedAt: latestChange,
      });
    }
    if (entry.logo_path) {
      assets.push({
        key: "logo",
        label: "Logo",
        path: entry.logo_path,
        recordedAt: latestChange,
      });
    }
    screenshots.forEach((screenshot, index) => {
      assets.push({
        key: `screenshot-${screenshot.id}`,
        label: screenshot.caption || `Screenshot ${index + 1}`,
        path: screenshot.file_path,
        recordedAt: screenshot.created_at ?? latestChange,
      });
    });

    return assets.sort((a, b) => {
      const left = a.recordedAt ? new Date(a.recordedAt).getTime() : 0;
      const right = b.recordedAt ? new Date(b.recordedAt).getTime() : 0;
      return right - left;
    });
  }, [entry, logs, screenshots]);

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
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }
    if (versions.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No artwork on record</EmptyTitle>
            <EmptyDescription>
              Upload cover, banner, logo, or screenshot art to build a history.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Recorded</TableHead>
            <TableHead className="text-right">Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {versions.map((version) => (
            <TableRow key={version.key}>
              <TableCell>
                <Badge
                  variant="outline"
                  className="bg-accent/10 text-accent border-accent/30"
                >
                  {version.label}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground max-w-[280px]">
                <span className="block truncate" title={version.path}>
                  {version.path}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatTimestamp(version.recordedAt)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {now === null ? "—" : relativeTime(version.recordedAt, now)}
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
          <ImageIcon className="w-5 h-5" />
          Artwork History
        </CardTitle>
        <CardDescription>
          Artwork assets on record with their most recent change time
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
