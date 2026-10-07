"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Trash2 } from "lucide-react";
import type { DuplicateGroup } from "@/lib/types";
import { plural } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDeleteEntry: (id: string) => void;
  onResolve: (keepId: string, duplicateIds: string[]) => Promise<void> | void;
}

/** Copies of the same file: pick the one to keep, delete the rest. */
export function DuplicateGroupCard({ group, onDeleteEntry, onResolve }: DuplicateGroupCardProps) {
  const [keepId, setKeepId] = useState(group.entries[0]?.id ?? "");
  const [resolving, setResolving] = useState(false);

  const kept = group.entries.find((entry) => entry.id === keepId);
  const duplicateIds = group.entries.filter((entry) => entry.id !== keepId).map((entry) => entry.id);
  const deleteLabel = `Delete ${plural(duplicateIds.length, "duplicate")}`;

  const resolve = async () => {
    if (duplicateIds.length === 0) return;
    if (!window.confirm(`Keep "${kept?.title ?? ""}" and delete ${plural(duplicateIds.length, "duplicate")}?`)) return;
    setResolving(true);
    try {
      await onResolve(keepId, duplicateIds);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-seam px-5 py-3">
        <p className="text-sm text-parchment">
          {plural(group.count, "copy", "copies")} of the same file
        </p>
        <code className="max-w-full truncate font-mono text-xs text-ash" title={group.file_hash}>
          {group.file_hash.slice(0, 16)}
        </code>
      </div>
      <ul className="divide-y divide-seam">
        {group.entries.map((entry) => {
          const isKept = entry.id === keepId;
          return (
            <li key={entry.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3", isKept && "bg-stone/50")}>
              <div className="min-w-0 flex-1 basis-56">
                <Link href={`/archive/${entry.id}`} className="font-medium text-parchment hover:text-violet-lit">
                  {entry.title}
                </Link>
                <p className="truncate font-mono text-xs text-ash" title={entry.file_path}>
                  {entry.file_path}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isKept ? "default" : "outline"}
                  aria-pressed={isKept}
                  disabled={resolving}
                  onClick={() => setKeepId(entry.id)}
                >
                  {isKept && <Check />}
                  {isKept ? "Kept" : "Keep"}
                </Button>
                <Button size="sm" variant="ghost" className="text-ember" disabled={resolving} onClick={() => onDeleteEntry(entry.id)}>
                  <Trash2 />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end border-t border-seam px-5 py-3">
        <Button variant="destructive" size="sm" disabled={resolving || duplicateIds.length === 0} onClick={resolve}>
          <Trash2 />
          {deleteLabel}
        </Button>
      </div>
    </Card>
  );
}
