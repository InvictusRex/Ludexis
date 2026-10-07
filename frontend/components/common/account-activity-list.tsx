"use client";

import { RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import type { AuditLogRead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Token refreshes happen every few minutes in the background; they would bury everything else.
// filtered client-side, so a long idle-refresh streak can leave fewer than SHOWN rows.
const FETCHED = 100;
const SHOWN = 15;

const ACTIONS: Record<string, string> = {
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILURE: "Failed sign-in attempt",
  LOGOUT: "Signed out",
  LOGOUT_ALL: "Signed out everywhere",
  CHANGE_PASSWORD: "Changed password",
  RESET_PASSWORD: "Reset a password",
  INITIALIZE_SYSTEM: "Set up the server",
  IDENTIFY_ARCHIVE: "Identified a game",
  MANUAL_METADATA_OVERRIDE: "Edited game details",
  RUN_FULL_SCAN: "Ran a full scan",
  RUN_INCREMENTAL_SCAN: "Ran an incremental scan",
  AUTO_DOWNLOAD_ARTWORK: "Downloaded artwork",
};

const VERBS: Record<string, string> = { create: "Created", update: "Updated", delete: "Deleted" };
const NOUNS: Record<string, string> = { ArchiveEntry: "game" };

/** Plain-language line for an audit entry, e.g. `update` on `ArchiveEntry` reads "Updated game". */
export function activityLabel({ action, entity }: Pick<AuditLogRead, "action" | "entity">): string {
  if (ACTIONS[action]) {
    return ACTIONS[action];
  }
  const verb = VERBS[action.toLowerCase()];
  if (verb) {
    const noun = NOUNS[entity] ?? entity.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return `${verb} ${noun}`;
  }
  const words = action.toLowerCase().replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatWhen(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function AccountActivityList({ userId }: { userId: string }) {
  const { data, error, loading, reload } = useApi(
    () => adminApi.getAuditLogs({ user_id: userId, limit: FETCHED }),
    [userId],
  );
  const logs = data?.filter((log) => log.action !== "TOKEN_REFRESH").slice(0, SHOWN);

  let body: React.ReactNode;
  if (error) {
    body = (
      <div className="space-y-3" role="alert">
        <p className="text-sm text-ash">Could not load your recent activity.</p>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw /> Retry
        </Button>
      </div>
    );
  } else if (loading || !logs) {
    body = (
      <ul className="divide-y divide-seam" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index} className="flex justify-between gap-4 py-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </li>
        ))}
      </ul>
    );
  } else if (logs.length === 0) {
    body = <p className="text-sm text-ash">Nothing yet. Sign-ins and changes you make will show up here.</p>;
  } else {
    body = (
      <ul className="divide-y divide-seam">
        {logs.map((log) => (
          <li key={log.id} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-parchment">{activityLabel(log)}</p>
              {log.details && (
                <p className="truncate text-xs text-ash" title={log.details}>
                  {log.details}
                </p>
              )}
            </div>
            <time dateTime={log.created_at} className="tabular shrink-0 text-xs text-ash">
              {formatWhen(log.created_at)}
            </time>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-labelledby="activity-heading" className="rounded-lg border border-seam bg-vault p-5">
      <h2 id="activity-heading" className="text-lg font-semibold text-parchment">
        Recent activity
      </h2>
      <p className="mt-1 text-sm text-ash">Your latest sign-ins and changes.</p>
      <div className="mt-3">{body}</div>
    </section>
  );
}
