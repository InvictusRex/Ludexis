"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import type { AuditLogRead } from "@/lib/types";
import { toastError } from "@/lib/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AUDIT_ENTITY = "ArchiveEntry";

interface MetadataHistoryCardProps {
  entryId: string;
}

export function MetadataHistoryCard({ entryId }: MetadataHistoryCardProps) {
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const data = await adminApi.getAuditLogs({
          entity: AUDIT_ENTITY,
          limit: 20,
        });
        if (cancelled) {
          return;
        }
        setLogs(data.filter((log) => log.entity_id === entryId));
      } catch (error) {
        if (!cancelled) {
          toastError(error, "Failed to load metadata history");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">Metadata History</h3>

      {loading ? (
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      ) : logs.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
          No metadata history yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.user_id ?? "System"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
