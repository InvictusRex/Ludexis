"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, ImagePlus, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { archiveApi, artworkApi } from "@/lib/api";
import type { ArchiveEntry, ArtworkType } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Logo, Poster, Shot } from "@/components/media/art";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EntryArtwork = Exclude<ArtworkType, "screenshot">;

const ARTWORK: { type: EntryArtwork; label: string; hint: string }[] = [
  { type: "cover", label: "Cover", hint: "Portrait, 2:3" },
  { type: "banner", label: "Banner", hint: "Wide backdrop for the game page" },
  { type: "logo", label: "Logo", hint: "Title art on a transparent background" },
];

const PATH: Record<EntryArtwork, "cover_path" | "banner_path" | "logo_path"> = {
  cover: "cover_path",
  banner: "banner_path",
  logo: "logo_path",
};

interface ArtworkManagementDialogProps {
  entry: ArchiveEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the refreshed game after any upload, replace or delete. */
  onChanged?: (entry: ArchiveEntry) => void;
}

function Preview({ type, path, label }: { type: EntryArtwork; path?: string; label: string }) {
  const alt = `${label} preview`;
  if (!path) {
    return (
      <div className="grid h-16 w-24 place-items-center rounded-md border border-dashed border-seam text-ash">
        <ImagePlus className="size-5" />
      </div>
    );
  }
  if (type === "cover") {
    return (
      <div className="flex h-16 w-24 justify-center">
        <Poster path={path} alt={alt} className="w-[2.7rem] rounded" />
      </div>
    );
  }
  if (type === "banner") {
    return <Shot path={path} alt={alt} className="h-16 w-24 rounded" />;
  }
  return (
    <div className="grid h-16 w-24 place-items-center rounded-md bg-night p-1.5">
      <Logo path={path} alt={alt} className="max-h-full max-w-full object-center drop-shadow-none" fallback={null} />
    </div>
  );
}

const CANDIDATE_SHAPE: Record<EntryArtwork, string> = {
  cover: "aspect-[2/3]",
  banner: "aspect-video",
  logo: "aspect-video bg-night",
};

const SOURCES: [string, string][] = [
  ["steamgriddb.com", "SteamGridDB"],
  ["vndb.org", "VNDB"],
  ["igdb.com", "IGDB"],
  ["steamstatic.com", "Steam"],
  ["steampowered.com", "Steam"],
];
const ARTWORK_SOURCES = "VNDB, IGDB, Steam and SteamGridDB";

function sourceOf(url: string) {
  try {
    const host = new URL(url).hostname;
    return SOURCES.find(([domain]) => host === domain || host.endsWith(`.${domain}`))?.[1];
  } catch {
    return undefined;
  }
}

/** Images the game's matched sources and SteamGridDB offer for one slot; picking one downloads it on the server. */
function CandidatePicker({
  type,
  urls,
  disabled,
  onPick,
}: {
  type: EntryArtwork;
  urls: string[] | null;
  disabled: boolean;
  onPick: (url: string) => void;
}) {
  if (urls === null) {
    return (
      <p className="flex w-full items-center gap-2 py-2 text-sm text-ash">
        <Loader2 className="size-4 animate-spin" /> Looking up {ARTWORK_SOURCES}…
      </p>
    );
  }
  if (urls.length === 0) {
    return (
      <p className="w-full py-2 text-sm text-ash">
        {ARTWORK_SOURCES} offer no {type} for this game. Identify it first, or upload one.
      </p>
    );
  }
  return (
    <ul className={cn("grid w-full gap-2", type === "cover" ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3")}>
      {urls.map((url) => {
        const source = sourceOf(url);
        return (
          <li key={url}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(url)}
              aria-label={source ? `Use this ${type} from ${source}` : `Use this ${type}`}
              className={cn(
                "relative block w-full overflow-hidden rounded-md bg-stone outline-none transition hover:ring-2 hover:ring-violet-lit focus-visible:ring-2 focus-visible:ring-violet-lit disabled:opacity-50",
                CANDIDATE_SHAPE[type],
              )}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className={cn("absolute inset-0 size-full object-center", type === "logo" ? "object-contain p-1" : "object-cover")}
              />
              {source && (
                <span className="absolute inset-x-0 bottom-0 truncate bg-night/80 px-1 py-0.5 text-[10px] font-medium text-parchment">
                  {source}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ArtworkManagementDialog({ entry, open, onOpenChange, onChanged }: ArtworkManagementDialogProps) {
  const [current, setCurrent] = useState<ArchiveEntry>(entry);
  const [busy, setBusy] = useState<ArtworkType | null>(null);
  const [browsing, setBrowsing] = useState<EntryArtwork | null>(null);
  const [candidates, setCandidates] = useState<string[] | null>(null);
  const fileInputs = useRef<Partial<Record<ArtworkType, HTMLInputElement | null>>>({});

  useEffect(() => {
    if (open) {
      setCurrent(entry);
      setBusy(null);
      setBrowsing(null);
    }
  }, [open, entry]);

  const browse = async (type: EntryArtwork) => {
    if (browsing === type) {
      setBrowsing(null);
      return;
    }
    setBrowsing(type);
    setCandidates(null);
    try {
      setCandidates(await artworkApi.candidates(entry.id, type));
    } catch (error) {
      toastError(error, "The matched sources could not be searched");
      setCandidates([]);
    }
  };

  const run = async (type: ArtworkType, action: () => Promise<unknown>, done: string, failed: string) => {
    setBusy(type);
    try {
      await action();
      toastSuccess(done);
      const refreshed = await archiveApi.getById(entry.id);
      setCurrent(refreshed);
      onChanged?.(refreshed);
    } catch (error) {
      toastError(error, failed);
    } finally {
      setBusy(null);
    }
  };

  const handleFile = (type: ArtworkType, file: File | null) => {
    if (!file) return;
    const input = { archive_entry_id: entry.id, artwork_type: type, file };
    const label = type === "screenshot" ? "Screenshot" : ARTWORK.find((art) => art.type === type)!.label;
    if (type !== "screenshot" && current[PATH[type]]) {
      run(type, () => artworkApi.replace(input), `${label} replaced`, `The ${label.toLowerCase()} could not be replaced`);
    } else {
      run(type, () => artworkApi.upload(input), `${label} uploaded`, `The ${label.toLowerCase()} could not be uploaded`);
    }
  };

  const fileInput = (type: ArtworkType, label: string) => (
    <input
      ref={(element) => {
        fileInputs.current[type] = element;
      }}
      type="file"
      accept="image/*"
      aria-label={`${label} file`}
      className="hidden"
      disabled={busy !== null}
      onChange={(event) => {
        handleFile(type, event.target.files?.[0] ?? null);
        event.target.value = "";
      }}
    />
  );

  const spinner = (type: ArtworkType, icon: React.ReactNode) => (busy === type ? <Loader2 className="animate-spin" /> : icon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage artwork</DialogTitle>
          <DialogDescription>Upload, replace or remove the artwork for {current.title}.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-seam">
          {ARTWORK.map(({ type, label, hint }) => {
            const path = current[PATH[type]];
            return (
              <li key={type} className="flex flex-wrap items-center gap-4 py-3">
                <Preview type={type} path={path} label={label} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-parchment">{label}</p>
                  <p className="text-xs text-ash">{path ? hint : "Missing"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={browsing === type ? "secondary" : "ghost"}
                    aria-label={`Find ${label.toLowerCase()} online`}
                    aria-expanded={browsing === type}
                    disabled={busy !== null}
                    onClick={() => browse(type)}
                  >
                    <Globe />
                    Find
                  </Button>
                  {path ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Replace ${label.toLowerCase()}`}
                        disabled={busy !== null}
                        onClick={() => fileInputs.current[type]?.click()}
                      >
                        {spinner(type, <RefreshCw />)}
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${label.toLowerCase()}`}
                        className="text-ember hover:text-ember"
                        disabled={busy !== null}
                        onClick={() =>
                          run(
                            type,
                            () => artworkApi.remove(entry.id, type),
                            `${label} deleted`,
                            `The ${label.toLowerCase()} could not be deleted`,
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => fileInputs.current[type]?.click()}>
                      {spinner(type, <Upload />)}
                      Upload {label.toLowerCase()}
                    </Button>
                  )}
                </div>
                {fileInput(type, label)}
                {browsing === type && (
                  <CandidatePicker
                    type={type}
                    urls={candidates}
                    disabled={busy !== null}
                    onPick={(url) =>
                      run(
                        type,
                        async () => {
                          await artworkApi.fromUrl(entry.id, type, url);
                          setBrowsing(null);
                        },
                        `${label} updated`,
                        `The ${label.toLowerCase()} could not be set`,
                      )
                    }
                  />
                )}
              </li>
            );
          })}
          <li className="flex flex-wrap items-center gap-4 py-3">
            <Preview type="banner" label="Screenshot" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-parchment">Screenshots</p>
              <p className="text-xs text-ash">Add as many as you like</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={() => fileInputs.current.screenshot?.click()}
            >
              {spinner("screenshot", <Upload />)}
              Upload screenshot
            </Button>
            {fileInput("screenshot", "Screenshot")}
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
