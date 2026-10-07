"use client";

import { useState } from "react";
import Link from "next/link";
import { Ellipsis, FolderOpen, FolderPlus, Images, Link2, Pencil, SearchCheck, Trash2 } from "lucide-react";
import type { ArchiveEntry } from "@/lib/types";
import { formatBytes, plural, year } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Logo, Poster } from "@/components/media/art";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { MetadataMark } from "@/components/media/status-mark";
import { libraryHref } from "@/components/library/library-params";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Longer descriptions start clamped behind a "More" toggle.
const LONG_DESCRIPTION = 280;
const TAGS_SHOWN = 12;

export function ChipLink({ href, children, quiet }: { href: string; children: React.ReactNode; quiet?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        quiet
          ? "border-seam/80 text-ash hover:border-ash/40 hover:text-parchment"
          : "border-seam bg-night/50 text-parchment backdrop-blur hover:border-violet-lit/60",
      )}
    >
      {children}
    </Link>
  );
}

interface GameHeroProps {
  entry: ArchiveEntry;
  versionCount: number;
  canEdit: boolean;
  onIdentify: () => void;
  onEdit: () => void;
  onManageArtwork: () => void;
  /** Shown when the viewer can manage collections. */
  onAddToCollection?: () => void;
  onCopyLink: () => void;
  /** Shown to administrators: the file manager opens on the machine running the server. */
  onOpenLocation?: () => void;
  onDelete: () => void;
}

export function GameHero({
  entry,
  versionCount,
  canEdit,
  onIdentify,
  onEdit,
  onManageArtwork,
  onAddToCollection,
  onCopyLink,
  onOpenLocation,
  onDelete,
}: GameHeroProps) {
  const [expanded, setExpanded] = useState(false);
  const [allTags, setAllTags] = useState(false);
  const long = (entry.description?.length ?? 0) > LONG_DESCRIPTION;
  const tags = entry.tags ?? [];
  const shownTags = allTags ? tags : tags.slice(0, TAGS_SHOWN);
  const meta = [
    year(entry.release_date),
    entry.engine,
    versionCount > 1 ? plural(versionCount, "version") : entry.version && `v${entry.version}`,
    formatBytes(entry.file_size),
  ].filter(Boolean);

  return (
    <BackdropHero banner={entry.banner_path} cover={entry.cover_path} size="detail">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end lg:gap-10">
        <Poster
          path={entry.cover_path}
          alt={entry.title}
          loading="eager"
          className="w-[136px] shrink-0 ring-1 ring-parchment/10 sm:w-[184px] lg:w-[232px]"
        />

        <div className="min-w-0 flex-1 space-y-4">
          <h1 data-mask>
            <Logo
              path={entry.logo_path}
              alt={entry.title}
              className="max-h-24 sm:max-h-32"
              fallback={
                <span className="block font-display text-3xl font-semibold leading-tight text-parchment text-balance sm:text-4xl lg:text-5xl">
                  {entry.title}
                </span>
              }
            />
          </h1>

          <div data-mask className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {meta.length > 0 && <p className="tabular text-parchment/85">{meta.join(" · ")}</p>}
            <MetadataMark status={entry.metadata_status} source={entry.metadata_source} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <Button onClick={onIdentify}>
                  <SearchCheck />
                  Identify
                </Button>
                <Button variant="outline" onClick={onEdit}>
                  <Pencil />
                  Edit
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-48">
                {canEdit && (
                  <DropdownMenuItem onSelect={onManageArtwork}>
                    <Images />
                    Manage artwork
                  </DropdownMenuItem>
                )}
                {onAddToCollection && (
                  <DropdownMenuItem onSelect={onAddToCollection}>
                    <FolderPlus />
                    Add to collection
                  </DropdownMenuItem>
                )}
                {onOpenLocation && (
                  <DropdownMenuItem onSelect={onOpenLocation}>
                    <FolderOpen />
                    Open file location
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={onCopyLink}>
                  <Link2 />
                  Copy link
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                      <Trash2 />
                      Delete game
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {entry.description && (
            <div data-mask className="max-w-[70ch]">
              <p
                id="game-description"
                className={cn("whitespace-pre-line leading-relaxed text-parchment/85", long && !expanded && "line-clamp-3")}
              >
                {entry.description}
              </p>
              {long && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls="game-description"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-1 text-sm font-medium text-violet-lit hover:text-parchment"
                >
                  {expanded ? "Less" : "More"}
                </button>
              )}
            </div>
          )}

          {(!!entry.genres?.length || tags.length > 0) && (
            <div data-mask className="flex flex-wrap items-center gap-2">
              {entry.genres?.map((genre) => (
                <ChipLink key={genre} href={libraryHref({ genre })}>
                  {genre}
                </ChipLink>
              ))}
              {shownTags.map((tag) => (
                <ChipLink key={tag.id} href={`/tags/${tag.id}`} quiet>
                  {tag.name}
                </ChipLink>
              ))}
              {tags.length > TAGS_SHOWN && (
                <button
                  type="button"
                  onClick={() => setAllTags((value) => !value)}
                  className="px-2 py-1 text-sm font-medium text-violet-lit hover:text-parchment"
                >
                  {allTags ? "Fewer tags" : `${tags.length - TAGS_SHOWN} more tags`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </BackdropHero>
  );
}
