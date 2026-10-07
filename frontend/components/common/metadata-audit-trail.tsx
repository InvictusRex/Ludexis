"use client";

import { adminApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// /admin/audit-logs cannot filter by entity id, so this reads the latest 100 game events
// and keeps this game's; older history drops out of view. Add an entity_id filter to the API to fix.
const AUDIT_LIMIT = 100;

const ACTIONS: Record<string, string> = {
  create: "Added to the library",
  update: "Details edited",
  delete: "Deleted",
  MANUAL_METADATA_OVERRIDE: "Metadata set by hand",
  IDENTIFY_ARCHIVE: "Identified",
  UPLOAD_ARTWORK: "Artwork uploaded",
  REPLACE_ARTWORK: "Artwork replaced",
  DELETE_ARTWORK: "Artwork removed",
};

export const auditActionLabel = (action: string) => ACTIONS[action] ?? action.replaceAll("_", " ").toLowerCase();

function actor(userId: string | null | undefined, currentUserId?: string) {
  if (!userId) return "the system";
  return userId === currentUserId ? "you" : "another user";
}

/** Recorded changes to one game, newest first. */
export function MetadataAuditTrail({ entryId, currentUserId }: { entryId: string; currentUserId?: string }) {
  const { data, error, reload } = useApi(async () => {
    const logs = await adminApi.getAuditLogs({ entity: "ArchiveEntry", limit: AUDIT_LIMIT });
    return logs
      .filter((log) => log.entity_id === entryId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [entryId]);

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3 py-6 text-sm text-ash">
        The history could not be loaded.
        <Button variant="outline" size="sm" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4 py-2" aria-hidden="true">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-5 w-72" />
      </div>
    );
  }
  if (data.length === 0) {
    return <p className="py-6 text-sm text-ash">No changes recorded for this game yet.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-seam pl-6">
      {data.map((log) => (
        <li key={log.id} className="relative">
          <span aria-hidden="true" className="absolute -left-[1.6rem] top-1.5 size-2 rounded-full bg-violet-lit ring-4 ring-night" />
          <p className="font-medium text-parchment">{auditActionLabel(log.action)}</p>
          {log.details && <p className="mt-0.5 text-sm text-parchment/80">{log.details}</p>}
          <p className="mt-0.5 text-xs text-ash">
            <time dateTime={log.created_at}>{new Date(log.created_at).toLocaleString()}</time> by{" "}
            <span title={log.user_id ?? undefined}>{actor(log.user_id, currentUserId)}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}
