"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, PenLine, SearchCheck, Undo2 } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry, MetadataStatus } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { announceReviewChanged } from "@/hooks/use-review-count";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Poster } from "@/components/media/art";
import { MetadataMark } from "@/components/media/status-mark";
import { EmptyState } from "@/components/brand/empty-state";
import { IdentifyDialog } from "@/components/common/identify-dialog";
import { ProviderSourceBadge } from "@/components/common/provider-source-badge";
import { ManualMetadataDialog } from "./manual-metadata-dialog";

const LIMIT = 100;

const GROUPS: { status: MetadataStatus; title: string }[] = [
  { status: "UNMATCHED", title: "Not identified" },
  { status: "PARTIAL", title: "Partly matched" },
];

type View = "open" | "resolved";

// Hidden collections are included: their games still need identifying.
const loadQueue = (view: View) =>
  Promise.all(
    GROUPS.map(({ status }) =>
      archiveApi.browse({
        metadata_status: status,
        review_resolved: view === "resolved",
        sort: "title",
        limit: LIMIT,
      }),
    ),
  );

export function ReviewQueue() {
  const [view, setView] = useState<View>("open");
  const queue = useApi(() => loadQueue(view), [view]);
  const [identifying, setIdentifying] = useState<ArchiveEntry | null>(null);
  const [editing, setEditing] = useState<ArchiveEntry | null>(null);

  const changed = () => {
    queue.reload();
    announceReviewChanged();
  };

  const setResolved = async (entry: ArchiveEntry, resolved: boolean) => {
    try {
      await archiveApi.update(entry.id, { review_resolved: resolved });
      toastSuccess(resolved ? `${entry.title} marked resolved` : `${entry.title} is back in the queue`);
      changed();
    } catch (error) {
      toastError(error, "The game could not be updated");
    }
  };

  const toggle = (
    <div role="group" aria-label="Show" className="mb-6 inline-flex rounded-lg border border-seam bg-vault p-1">
      {(
        [
          ["open", "Unresolved"],
          ["resolved", "Resolved"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => setView(value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === value ? "bg-stone text-parchment" : "text-ash hover:text-parchment",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  if (queue.error) {
    return (
      <>
      {toggle}
        <EmptyState
          title="The review queue could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={queue.reload}>Try again</Button>}
        />
      </>
    );
  }

  if (!queue.data) {
    return (
      <>
        {toggle}
        <Card className="gap-3 px-5">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 w-full" />
          ))}
        </Card>
      </>
    );
  }

  if (queue.data.every((page) => page.total === 0)) {
    return (
      <>
        {toggle}
        {view === "open" ? (
          <EmptyState
            title="Nothing to review"
            description="New games that a scan cannot match on its own will wait here for you."
          />
        ) : (
          <EmptyState
            title="No resolved games"
            description="Games you mark resolved keep their current details and stop showing a red dot."
          />
        )}
      </>
    );
  }

  return (
    <div>
      {toggle}
      <div className="space-y-8">
        {GROUPS.map((group, index) => {
          const { items, total } = queue.data![index];
          if (total === 0) return null;
          return (
            <section key={group.status} aria-labelledby={`queue-${group.status}`}>
              <h3 id={`queue-${group.status}`} className="mb-3 flex items-baseline gap-2 font-semibold text-parchment">
                {group.title}
                <span className="tabular text-sm font-normal text-ash">{total.toLocaleString()}</span>
              </h3>
              <Card className="gap-0 py-0">
                <ul className="divide-y divide-seam">
                  {items.map((entry) => (
                    <ReviewRow
                      key={entry.id}
                      entry={entry}
                      onIdentify={setIdentifying}
                      onEdit={setEditing}
                      onResolve={(resolved) => setResolved(entry, resolved)}
                    />
                  ))}
                </ul>
              </Card>
              {total > items.length && (
                <p className="mt-3 text-sm text-ash">
                  Showing the first {plural(items.length, "game")}.{" "}
                  <Link href={`/library?metadata_status=${group.status}`} className="text-violet-lit hover:underline">
                    See all {total.toLocaleString()} in the library
                  </Link>
                </p>
              )}
            </section>
          );
        })}
      </div>

      {identifying && (
        <IdentifyDialog
          entry={identifying}
          open
          onOpenChange={(open) => !open && setIdentifying(null)}
          onIdentified={() => {
            setIdentifying(null);
            changed();
          }}
        />
      )}
      <ManualMetadataDialog entry={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={changed} />
    </div>
  );
}

function ReviewRow({
  entry,
  onIdentify,
  onEdit,
  onResolve,
}: {
  entry: ArchiveEntry;
  onIdentify: (entry: ArchiveEntry) => void;
  onEdit: (entry: ArchiveEntry) => void;
  onResolve: (resolved: boolean) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3">
      <Poster path={entry.cover_path} alt={entry.title} className="w-10 shrink-0" />
      <div className="min-w-0 flex-1 basis-48">
        <Link href={`/archive/${entry.id}`} className="font-medium text-parchment hover:text-violet-lit">
          {entry.title}
        </Link>
        <p className="truncate font-mono text-xs text-ash" title={entry.file_path}>
          {entry.file_path}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <MetadataMark status={entry.metadata_status} className="text-xs" />
          {entry.metadata_status === "PARTIAL" && (
            <>
              <ProviderSourceBadge source={entry.metadata_source} sourceCode={entry.metadata_source_code} />
              {entry.metadata_confidence != null && (
                <span className="tabular text-xs text-ash">{Math.round(entry.metadata_confidence * 100)}% confident</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onIdentify(entry)}>
          <SearchCheck />
          Identify
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(entry)}>
          <PenLine />
          Edit by hand
        </Button>
        {entry.review_resolved ? (
          <Button size="sm" variant="ghost" onClick={() => onResolve(false)}>
            <Undo2 />
            Reopen
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onResolve(true)}>
            <CheckCheck />
            Mark resolved
          </Button>
        )}
      </div>
    </li>
  );
}
