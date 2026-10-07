"use client";

import { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { collectionsApi } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AddToCollectionDialogProps {
  entryIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}

export function AddToCollectionDialog({ entryIds, open, onOpenChange, onAdded }: AddToCollectionDialogProps) {
  const collections = useApi(() => (open ? collectionsApi.getAll(0, 100) : Promise.resolve([])), [open]);
  const [adding, setAdding] = useState<string | null>(null);

  const add = async (collection: Collection) => {
    setAdding(collection.id);
    const results = await Promise.allSettled(entryIds.map((id) => collectionsApi.addEntry(collection.id, id)));
    const failed = results.filter((result) => result.status === "rejected").length;
    setAdding(null);
    if (failed) {
      toastError(undefined, `${plural(failed, "game")} could not be added to ${collection.name}`);
    } else {
      toastSuccess(`Added ${plural(entryIds.length, "game")} to ${collection.name}`);
    }
    onAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !adding && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to collection</DialogTitle>
          <DialogDescription>Pick a collection for {plural(entryIds.length, "selected game")}.</DialogDescription>
        </DialogHeader>
        {collections.loading ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : collections.data?.length ? (
          <ul className="-mx-2 max-h-[50vh] overflow-y-auto">
            {collections.data.map((collection) => (
              <li key={collection.id}>
                <button
                  type="button"
                  disabled={adding !== null}
                  onClick={() => add(collection)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-parchment outline-none hover:bg-night/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                >
                  {adding === collection.id ? (
                    <Loader2 className="size-4 animate-spin text-violet-lit" />
                  ) : (
                    <FolderOpen className="size-4 text-ash" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{collection.name}</span>
                  <span className="text-xs tabular text-ash">{plural(collection.entry_ids.length, "game")}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-ash">
            {collections.error ? "Collections could not be loaded." : "No collections yet. Create one on the Collections page."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
