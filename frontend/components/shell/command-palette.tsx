"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Building2, Crown, GalleryVerticalEnd, Hammer, Search, Tag, type LucideIcon } from "lucide-react";
import {
  archiveApi,
  collectionsApi,
  developersApi,
  franchisesApi,
  publishersApi,
  tagsApi,
} from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { year } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Result {
  key: string;
  href: string;
  label: string;
  detail?: string;
  cover?: string | null;
  icon?: LucideIcon;
}

const DEBOUNCE_MS = 180;

async function find(q: string): Promise<Result[]> {
  const [games, collections, developers, publishers, franchises, tags] = await Promise.all([
    archiveApi.browse({ q, limit: 6, group_versions: true }),
    collectionsApi.getAll(0, 3, q),
    developersApi.getAll(0, 3, q),
    publishersApi.getAll(0, 3, q),
    franchisesApi.getAll(0, 3, q),
    tagsApi.getAll(0, 3, q),
  ]);
  const named = (path: string, icon: LucideIcon, detail: string) => (item: { id: string; name: string }) => ({
    key: `${path}-${item.id}`,
    href: `/${path}/${item.id}`,
    label: item.name,
    detail,
    icon,
  });

  return [
    ...games.items.map((game: ArchiveEntry) => ({
      key: `game-${game.id}`,
      href: `/archive/${game.id}`,
      label: game.title,
      detail: year(game.release_date) ?? "Game",
      cover: game.cover_path,
    })),
    ...collections.map(named("collections", GalleryVerticalEnd, "Collection")),
    ...developers.items.map(named("developers", Hammer, "Developer")),
    ...publishers.items.map(named("publishers", Building2, "Publisher")),
    ...franchises.items.map(named("franchises", Crown, "Franchise")),
    ...tags.items.map(named("tags", Tag, "Tag")),
  ];
}

/** ⌘K / Ctrl+K or "/" anywhere: jump to a game, collection, company, franchise or tag. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const q = query.trim();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]");
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      find(q).then(
        (found) => current && setResults(found),
        () => current && setResults([]),
      );
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [q]);

  // The first row always searches the whole library for the typed text.
  const rows = useMemo<Result[]>(
    () =>
      q
        ? [{ key: "library", href: `/library?q=${encodeURIComponent(q)}`, label: `Search the library for “${q}”`, icon: Search }, ...results]
        : [],
    [q, results],
  );

  useEffect(() => setActive(0), [rows.length]);

  const go = (row?: Result) => {
    if (!row) return;
    onOpenChange(false);
    setQuery("");
    router.push(row.href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-night/75 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed left-1/2 top-[12vh] z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-seam bg-stone shadow-[0_24px_80px_-20px_rgb(0_0_0/0.8)]"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const step = event.key === "ArrowDown" ? 1 : -1;
              setActive((index) => (rows.length ? (index + step + rows.length) % rows.length : 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              go(rows[active]);
            }
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Find a game, collection, company, franchise or tag.
          </DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-seam px-4">
            <Search className="size-5 shrink-0 text-ash" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your archive"
              aria-label="Search your archive"
              role="combobox"
              aria-expanded={rows.length > 0}
              aria-controls="command-results"
              aria-activedescendant={rows[active] ? `command-${rows[active].key}` : undefined}
              className="h-14 w-full bg-transparent text-lg text-parchment outline-none placeholder:text-ash"
            />
            <kbd className="hidden rounded border border-seam px-1.5 py-0.5 text-xs text-ash sm:block">Esc</kbd>
          </div>

          {rows.length > 0 ? (
            <ul id="command-results" role="listbox" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
              {rows.map((row, index) => {
                const Icon = row.icon;
                return (
                  <li
                    key={row.key}
                    id={`command-${row.key}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => go(row)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                      index === active ? "bg-accent text-parchment" : "text-parchment/90",
                    )}
                  >
                    {Icon ? (
                      <span className="grid h-10 w-[30px] shrink-0 place-items-center text-ash">
                        <Icon className="size-[18px]" />
                      </span>
                    ) : (
                      <span className="relative h-10 w-[30px] shrink-0 overflow-hidden rounded bg-vault">
                        {row.cover ? (
                          <img src={mediaUrl(row.cover)} alt="" className="size-full object-cover object-center" />
                        ) : (
                          <img src="/brand/shield.png" alt="" className="absolute inset-1 m-auto w-5" />
                        )}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{row.label}</span>
                    {row.detail && <span className="shrink-0 text-xs text-ash">{row.detail}</span>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-ash">
                {q.length === 1 ? "Keep typing…" : "Type a title, a studio, a franchise or a tag."}
              </p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
