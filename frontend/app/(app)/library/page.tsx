"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckSquare,
  Grid2x2,
  Grid3x3,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { can, canSeeDashboard } from "@/lib/permissions";
import { plural } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { Page, PageHeader } from "@/components/shell/page";
import { EmptyState } from "@/components/brand/empty-state";
import { PosterCard } from "@/components/media/poster-card";
import { PosterGrid, PosterSkeletons } from "@/components/media/poster-grid";
import { BulkActionBar } from "@/components/common/bulk-action-bar";
import { AddToCollectionDialog } from "@/components/library/add-to-collection-dialog";
import { ConfirmDialog } from "@/components/library/confirm-dialog";
import { FilterSheetContent, filterChipLabel, type LibraryFilters } from "@/components/library/library-filters";
import {
  FILTER_KEYS,
  activeFilters,
  libraryHref,
  parseLibraryParams,
  sortDescending,
  sortField,
  toLibraryQuery,
  type LibraryState,
  type SortField,
} from "@/components/library/library-params";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 60;

const SORT_LABELS: Record<SortField, string> = {
  title: "Title",
  created_at: "Recently added",
  release_date: "Release date",
  file_size: "Size",
};
// The direction a field starts in when picked: A to Z, everything else newest/largest first.
const DEFAULT_DESCENDING: Record<SortField, boolean> = {
  title: false,
  created_at: true,
  release_date: true,
  file_size: true,
};

export default function LibraryPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<LibrarySkeleton />}>
      <Library />
    </Suspense>
  );
}

function LibrarySkeleton() {
  return (
    <Page>
      <Skeleton className="mb-8 h-9 w-40" />
      <Skeleton className="mb-8 h-10 w-full max-w-xl" />
      <PosterGrid>
        <PosterSkeletons count={18} />
      </PosterGrid>
    </Page>
  );
}

function Library() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const state = useMemo(() => parseLibraryParams(new URLSearchParams(searchParams.toString())), [searchParams]);

  const update = useCallback(
    (patch: Partial<LibraryState>) => router.replace(libraryHref({ ...state, ...patch }), { scroll: false }),
    [router, state],
  );

  const query = useMemo(() => toLibraryQuery(state), [state]);
  const queryKey = JSON.stringify(query);
  const filters = activeFilters(state);
  const filtered = filters.length > 0 || !!state.q;

  // Search box: local text, written to the URL after a pause.
  const [text, setText] = useState(state.q);
  const [syncedQ, setSyncedQ] = useState(state.q);
  if (state.q !== syncedQ) {
    setSyncedQ(state.q);
    if (text.trim() !== state.q) setText(state.q);
  }
  useEffect(() => {
    if (text.trim() === state.q) return;
    const timer = setTimeout(() => update({ q: text }), 300);
    return () => clearTimeout(timer);
  }, [text, state.q, update]);

  // Pages of results, appended as the sentinel scrolls into view.
  const [items, setItems] = useState<ArchiveEntry[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [reloadToken, setReloadToken] = useState(0);
  const currentKey = useRef("");

  const loadPage = useCallback(
    async (offset: number) => {
      const key = currentKey.current;
      setLoading(true);
      setError(undefined);
      try {
        const page = await archiveApi.browse({ ...JSON.parse(queryKey), offset, limit: PAGE_SIZE });
        if (currentKey.current !== key) return;
        setItems((previous) => (offset === 0 ? page.items : [...previous, ...page.items]));
        setTotal(page.total);
      } catch (cause) {
        if (currentKey.current === key) setError(cause);
      } finally {
        if (currentKey.current === key) setLoading(false);
      }
    },
    [queryKey],
  );

  useEffect(() => {
    currentKey.current = `${queryKey}#${reloadToken}`;
    setItems([]);
    setTotal(null);
    loadPage(0);
  }, [queryKey, reloadToken, loadPage]);

  const hasMore = total !== null && items.length < total;
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading || error) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && loadPage(items.length),
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, error, items.length, loadPage]);

  // Selection (editors only).
  const canDelete = can(user, "EDIT_METADATA");
  const canCollect = can(user, "MANAGE_COLLECTIONS");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collectOpen, setCollectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const deleteSelected = async () => {
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map((id) => archiveApi.delete(id)));
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) {
      toastError(undefined, `${plural(failed, "game")} could not be deleted`);
    } else {
      toastSuccess(`Deleted ${plural(ids.length, "game")}`);
    }
    stopSelecting();
    setReloadToken((token) => token + 1);
  };

  const [filtersOpen, setFiltersOpen] = useState(false);
  const clearFilters = () => {
    setText("");
    update({ q: "", ...Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined])) });
  };

  const field = sortField(state.sort);
  const descending = sortDescending(state.sort);
  const setSort = (next: SortField, desc: boolean) => update({ sort: desc ? `-${next}` : next } as Partial<LibraryState>);

  return (
    <Page>
      <PageHeader
        title="Library"
        description={
          total === null ? <span className="invisible">Loading</span> : <span className="tabular">{plural(total, "game")}</span>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-full sm:max-w-sm sm:basis-auto">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ash" />
          <Input
            type="search"
            aria-label="Search the library"
            placeholder="Search titles, people, tags"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-10 pl-9"
          />
        </div>

        <div className="flex items-center">
          <Select value={field} onValueChange={(value) => setSort(value as SortField, DEFAULT_DESCENDING[value as SortField])}>
            <SelectTrigger aria-label="Sort by" className="h-10 min-w-36 rounded-r-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortField[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {SORT_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0"
            aria-label={descending ? "Sorted descending, switch to ascending" : "Sorted ascending, switch to descending"}
            onClick={() => setSort(field, !descending)}
          >
            {descending ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />}
          </Button>
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <Button variant="outline" className="h-10" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal />
            Filters
            {filters.length > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-violet text-xs tabular text-white">
                {filters.length}
              </span>
            )}
          </Button>
          {filtersOpen && (
            <FilterSheetContent
              filters={Object.fromEntries(filters) as LibraryFilters}
              onApply={(next) => {
                update(next);
                setFiltersOpen(false);
              }}
            />
          )}
        </Sheet>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="group-versions" checked={state.group} onCheckedChange={(group) => update({ group })} />
            <Label htmlFor="group-versions" className="whitespace-nowrap text-sm text-ash">
              Group versions
            </Label>
          </div>
          <div role="group" aria-label="Poster size" className="flex rounded-lg border border-seam p-0.5">
            {(
              [
                ["comfortable", Grid2x2, "Large posters"],
                ["compact", Grid3x3, "Small posters"],
              ] as const
            ).map(([density, Icon, label]) => (
              <button
                key={density}
                type="button"
                aria-label={label}
                aria-pressed={state.density === density}
                onClick={() => update({ density })}
                className={cn(
                  "grid size-8 place-items-center rounded-md text-ash outline-none hover:text-parchment focus-visible:ring-2 focus-visible:ring-ring",
                  state.density === density && "bg-stone text-parchment",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
          {(canDelete || canCollect) && (
            <Button
              variant={selecting ? "default" : "outline"}
              className="h-10"
              aria-pressed={selecting}
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
            >
              <CheckSquare />
              {selecting ? "Done" : "Select"}
            </Button>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filters.map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => update({ [key]: undefined })}
              aria-label={`Remove filter ${filterChipLabel(key, value)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-seam bg-stone py-1 pl-3 pr-2 text-sm text-parchment outline-none hover:border-ash/40 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {filterChipLabel(key, value)}
              <X aria-hidden="true" className="size-3.5 text-ash" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="rounded px-2 py-1 text-sm font-medium text-violet-lit hover:text-parchment"
          >
            Clear filters
          </button>
        </div>
      )}

      {error && items.length === 0 ? (
        <EmptyState
          title="The library could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={() => setReloadToken((token) => token + 1)}>Try again</Button>}
        />
      ) : total === 0 ? (
        filtered ? (
          <EmptyState
            title="No games match"
            description="Try a different search or remove a filter."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <EmptyState
            title="No games yet"
            description={
              canSeeDashboard(user)
                ? "Add a library folder in Admin Dashboard → Libraries, then run a scan."
                : "Ask an administrator to add a library folder and run a scan."
            }
            action={
              canSeeDashboard(user) && (
                <Button asChild>
                  <Link href="/admin/libraries">Open Libraries</Link>
                </Button>
              )
            }
          />
        )
      ) : (
        <>
          <PosterGrid density={state.density}>
            {items.map((entry, index) => (
              <PosterCard
                key={entry.id}
                entry={entry}
                loading={index < 12 ? "eager" : "lazy"}
                selecting={selecting}
                selected={selected.has(entry.id)}
                onToggle={toggle}
              />
            ))}
            {loading && <PosterSkeletons count={items.length ? 6 : 18} />}
          </PosterGrid>
          <div ref={sentinel} aria-hidden="true" className="h-px" />
          {error && items.length > 0 && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => loadPage(items.length)}>
                {loading && <Loader2 className="animate-spin" />}
                Load more games
              </Button>
            </div>
          )}
        </>
      )}

      {selecting && (
        <BulkActionBar
          selectedCount={selected.size}
          onAddToCollection={canCollect ? () => setCollectOpen(true) : undefined}
          onDelete={canDelete ? () => setDeleteOpen(true) : undefined}
          onClear={() => setSelected(new Set())}
        />
      )}
      <AddToCollectionDialog
        entryIds={[...selected]}
        open={collectOpen}
        onOpenChange={setCollectOpen}
        onAdded={stopSelecting}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${plural(selected.size, "game")}?`}
        description="They are removed from the library. Files on disk are not touched."
        confirmLabel="Delete"
        onConfirm={deleteSelected}
      />
    </Page>
  );
}
