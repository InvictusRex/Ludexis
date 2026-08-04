import { useState } from "react";
import { Check, Loader2, Trash2, Users } from "lucide-react";
import type { DuplicateGroup } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  onDeleteEntry: (id: string) => void;
  onResolve: (keepId: string, duplicateIds: string[]) => Promise<void> | void;
}

export function DuplicateGroupCard({
  group,
  onDeleteEntry,
  onResolve,
}: DuplicateGroupCardProps) {
  const [keepId, setKeepId] = useState(group.entries[0]?.id ?? "");
  const [resolving, setResolving] = useState(false);

  const keptEntry = group.entries.find((entry) => entry.id === keepId);
  const duplicateIds = group.entries
    .filter((entry) => entry.id !== keepId)
    .map((entry) => entry.id);

  const handleResolve = async () => {
    if (duplicateIds.length === 0) {
      return;
    }
    const message = `Keep "${keptEntry?.title ?? ""}" and delete ${duplicateIds.length} duplicate${duplicateIds.length !== 1 ? "s" : ""}?`;
    if (!window.confirm(message)) {
      return;
    }
    setResolving(true);
    try {
      await onResolve(keepId, duplicateIds);
    } finally {
      setResolving(false);
    }
  };

  return (
    <Card
      className={`border-border ${group.count > 2 ? "border-amber-500/50 bg-amber-500/5" : ""}`}
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-3 text-sm">
          <code className="font-mono text-xs text-muted-foreground break-all">
            {group.file_hash}
          </code>
          <Badge
            variant={group.count > 2 ? "default" : "secondary"}
            className={group.count > 2 ? "bg-amber-500/15 text-amber-500 border-amber-500/50" : ""}
          >
            <Users className="w-3 h-3" />
            {group.count} duplicate{group.count !== 1 ? "s" : ""}
          </Badge>
          {group.count > 2 && (
            <Badge variant="destructive" className="ml-auto">
              Review
            </Badge>
          )}
          {resolving && (
            <Badge variant="secondary" className="ml-auto">
              <Loader2 className="w-3 h-3 animate-spin" />
              Resolving...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {group.entries.map((entry) => {
          const isKept = entry.id === keepId;
          return (
            <div
              key={entry.id}
              className="flex flex-col gap-1 p-3 rounded-md bg-card border border-border"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{entry.title}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={isKept ? "default" : "outline"}
                    onClick={() => setKeepId(entry.id)}
                    disabled={resolving}
                  >
                    {isKept && <Check className="w-4 h-4" />}
                    {isKept ? "Kept" : "Keep"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => onDeleteEntry(entry.id)}
                    disabled={resolving}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground break-all">
                {entry.file_path}
              </span>
            </div>
          );
        })}
        <Button
          variant="destructive"
          onClick={handleResolve}
          disabled={resolving || duplicateIds.length === 0}
          className="w-full gap-2"
        >
          {resolving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {resolving
            ? "Resolving..."
            : `Delete ${duplicateIds.length} duplicate${duplicateIds.length !== 1 ? "s" : ""}`}
        </Button>
      </CardContent>
    </Card>
  );
}
