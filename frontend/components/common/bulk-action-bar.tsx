import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onAddToCollection: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onAddToCollection,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 z-20 bg-card border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
      <Badge variant="secondary" className="text-sm">
        {selectedCount} selected
      </Badge>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
        <Button variant="default" onClick={onAddToCollection}>
          Add to collection
        </Button>
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
