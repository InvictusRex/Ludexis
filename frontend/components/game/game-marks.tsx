"use client";

import { useEffect, useState } from "react";
import { CircleCheck, Star } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Mark = "is_favorite" | "is_completed";

/** The signed-in user's own favourite and completed toggles for one game. */
export function GameMarks({ entry }: { entry: ArchiveEntry }) {
  const [marks, setMarks] = useState({ is_favorite: !!entry.is_favorite, is_completed: !!entry.is_completed });

  useEffect(() => {
    setMarks({ is_favorite: !!entry.is_favorite, is_completed: !!entry.is_completed });
  }, [entry.id, entry.is_favorite, entry.is_completed]);

  const toggle = async (mark: Mark) => {
    const previous = marks;
    setMarks({ ...marks, [mark]: !marks[mark] });
    try {
      setMarks(await archiveApi.setFlags(entry.id, { [mark]: !previous[mark] }));
    } catch (error) {
      setMarks(previous);
      toastError(error, "Could not save that");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" aria-pressed={marks.is_favorite} onClick={() => toggle("is_favorite")}>
        <Star className={cn(marks.is_favorite && "fill-spark text-spark")} />
        {marks.is_favorite ? "Favourite" : "Add to favourites"}
      </Button>
      <Button variant="outline" aria-pressed={marks.is_completed} onClick={() => toggle("is_completed")}>
        <CircleCheck className={cn(marks.is_completed && "fill-moss text-night")} />
        {marks.is_completed ? "Completed" : "Mark completed"}
      </Button>
    </div>
  );
}
