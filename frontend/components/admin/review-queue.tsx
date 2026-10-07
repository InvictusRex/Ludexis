"use client";

import { useState } from "react";
import Link from "next/link";
import { PenLine, SearchCheck } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry, MetadataStatus } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
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

const loadQueue = () =>
  Promise.all(GROUPS.map(({ status }) => archiveApi.browse({ metadata_status: status, sort: "title", limit: LIMIT })));

export function ReviewQueue() {
  const queue = useApi(loadQueue, []);
  const [identifying, setIdentifying] = useState<ArchiveEntry | null>(null);
  const [editing, setEditing] = useState<ArchiveEntry | null>(null);

  if (queue.error) {
    return (
      <EmptyState
        title="The review queue could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={queue.reload}>Try again</Button>}
      />
    );
  }

  if (!queue.data) {
    return (
      <Card className="gap-3 px-5">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </Card>
    );
  }

  if (queue.data.every((page) => page.total === 0)) {
    return (
      <EmptyState
        title="Every game is identified"
        description="New games that a scan cannot match on its own will wait here for you."
      />
    );
  }

  return (
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
                  <ReviewRow key={entry.id} entry={entry} onIdentify={setIdentifying} onEdit={setEditing} />
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

      {identifying && (
        <IdentifyDialog
          entry={identifying}
          open
          onOpenChange={(open) => !open && setIdentifying(null)}
          onIdentified={() => {
            setIdentifying(null);
            queue.reload();
          }}
        />
      )}
      <ManualMetadataDialog entry={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={queue.reload} />
    </div>
  );
}

function ReviewRow({
  entry,
  onIdentify,
  onEdit,
}: {
  entry: ArchiveEntry;
  onIdentify: (entry: ArchiveEntry) => void;
  onEdit: (entry: ArchiveEntry) => void;
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
      </div>
    </li>
  );
}
