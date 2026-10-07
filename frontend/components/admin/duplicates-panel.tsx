"use client";

import { RefreshCw } from "lucide-react";
import { archiveApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/brand/empty-state";
import { DuplicateGroupCard } from "./duplicate-group-card";

export function DuplicatesPanel() {
  const groups = useApi(() => archiveApi.getDuplicates(), []);

  const deleteEntry = async (id: string) => {
    if (!window.confirm("Delete this game from the library?")) return;
    try {
      await archiveApi.delete(id);
      toastSuccess("Game deleted");
      groups.reload();
    } catch (error) {
      toastError(error, "Could not delete the game");
    }
  };

  const resolve = async (_keepId: string, duplicateIds: string[]) => {
    const results = await Promise.allSettled(duplicateIds.map((id) => archiveApi.delete(id)));
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed === 0) {
      toastSuccess(`Deleted ${plural(results.length, "duplicate")}`);
    } else {
      toastError(null, `Deleted ${results.length - failed} of ${plural(results.length, "duplicate")}`);
    }
    groups.reload();
  };

  if (groups.error) {
    return (
      <EmptyState
        title="Duplicates could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={groups.reload}>Try again</Button>}
      />
    );
  }

  if (!groups.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (groups.data.length === 0) {
    return (
      <EmptyState
        title="No duplicates found"
        description="Games whose files have identical contents show up here after a scan."
        action={
          <Button variant="outline" onClick={groups.reload}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />
    );
  }

  // Groups with more than two copies first: they waste the most space.
  const sorted = [...groups.data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ash">
          {plural(groups.data.length, "file")} stored more than once. Keep one copy of each and delete the rest.
        </p>
        <Button variant="outline" onClick={groups.reload} disabled={groups.loading}>
          <RefreshCw />
          Refresh
        </Button>
      </div>
      {sorted.map((group) => (
        <DuplicateGroupCard key={group.file_hash} group={group} onDeleteEntry={deleteEntry} onResolve={resolve} />
      ))}
    </div>
  );
}
