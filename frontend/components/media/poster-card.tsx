"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { ArchiveEntry } from "@/lib/types";
import { year } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Poster } from "./art";

interface PosterCardProps {
  entry: ArchiveEntry;
  /** In selection mode a click toggles the card instead of opening the game. */
  selecting?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
  loading?: "lazy" | "eager";
}

export function PosterCard({ entry, selecting, selected, onToggle, loading }: PosterCardProps) {
  const versions = entry.version_count ?? 1;

  return (
    <Link
      href={`/archive/${entry.id}`}
      aria-pressed={selecting ? selected : undefined}
      onClick={(event) => {
        if (selecting) {
          event.preventDefault();
          onToggle?.(entry.id);
        }
      }}
      className="group block rounded-md outline-none"
    >
      <div
        className={cn(
          "relative rounded-md transition-[transform,box-shadow] duration-200",
          "group-hover:-translate-y-[3px] group-hover:shadow-[0_0_0_1px_var(--violet-lit),0_14px_32px_-14px_rgb(91_53_163/0.75)]",
          "group-focus-visible:shadow-[0_0_0_2px_var(--violet-lit)]",
          selected && "shadow-[0_0_0_2px_var(--violet-lit)]",
        )}
      >
        <Poster path={entry.cover_path} alt={entry.title} loading={loading} />

        {entry.library_status === "OFFLINE" && (
          <span
            className="absolute left-2 top-2 rounded-full bg-night/85 px-2 py-0.5 text-xs font-medium text-spark backdrop-blur"
            title="The drive or folder holding this game is not connected"
          >
            Offline
          </span>
        )}
        {versions > 1 && (
          <span className="absolute bottom-2 left-2 rounded-full bg-night/85 px-2 py-0.5 text-xs font-medium tabular text-parchment backdrop-blur">
            {versions} versions
          </span>
        )}
        {selecting && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-2 top-2 grid size-6 place-items-center rounded-full border-2 backdrop-blur",
              selected ? "border-violet-lit bg-violet text-white" : "border-parchment/70 bg-night/60",
            )}
          >
            {selected && <Check className="size-3.5" strokeWidth={3} />}
          </span>
        )}
      </div>

      {/* Room for a two-line title plus the year, so rows stay aligned and the year hugs the title. */}
      <div className="mt-2.5 min-h-[3.9rem] px-0.5">
        <p className="line-clamp-2 text-sm font-medium leading-[1.45] text-parchment group-hover:text-white">
          {entry.title}
        </p>
        <p className="mt-0.5 text-xs text-ash tabular">{year(entry.release_date)}</p>
      </div>
    </Link>
  );
}
