import { FolderPlus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { plural } from "@/lib/format";

interface BulkActionBarProps {
  selectedCount: number;
  /** Omitted when the user may not delete games. */
  onDelete?: () => void;
  /** Omitted when the user may not manage collections. */
  onAddToCollection?: () => void;
  onClear: () => void;
}

/** Floats at the bottom of the grid while games are selected. */
export function BulkActionBar({ selectedCount, onDelete, onAddToCollection, onClear }: BulkActionBarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Selected games"
      className="sticky bottom-4 z-30 mx-auto mt-8 flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-seam bg-stone/95 p-2 pl-4 backdrop-blur"
    >
      <span className="mr-2 text-sm font-medium tabular text-parchment" aria-live="polite">
        {plural(selectedCount, "game")} selected
      </span>
      {onAddToCollection && (
        <Button size="sm" onClick={onAddToCollection}>
          <FolderPlus />
          Add to collection
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X />
        Clear
      </Button>
    </div>
  );
}
