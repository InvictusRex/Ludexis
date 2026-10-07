"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry, LibraryQuery } from "@/lib/types";
import { EmptyState } from "@/components/brand/empty-state";
import { PosterCard } from "@/components/media/poster-card";
import { PosterGrid, PosterSkeletons } from "@/components/media/poster-grid";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 60;

interface Pages {
  items: ArchiveEntry[];
  total?: number;
  loading: boolean;
  error?: unknown;
}

const START: Pages = { items: [], loading: true };

/**
 * Games from `/search/`, a page at a time; `sentinel` loads the next page as it nears the viewport.
 * Pass `null` to wait (for example until the collection name is known).
 */
export function useGamePages(query: LibraryQuery | null) {
  const key = query ? JSON.stringify(query) : null;
  const [pages, setPages] = useState<Pages>(START);
  const generation = useRef(0);
  const busy = useRef(false);

  const load = useCallback(
    async (offset: number) => {
      if (!key) {
        return;
      }
      const current = generation.current;
      busy.current = true;
      setPages((previous) => ({ ...previous, loading: true, error: undefined }));
      try {
        const page = await archiveApi.browse({ ...JSON.parse(key), offset, limit: PAGE_SIZE });
        if (current === generation.current) {
          setPages((previous) => ({
            items: offset === 0 ? page.items : [...previous.items, ...page.items],
            total: page.total,
            loading: false,
          }));
        }
      } catch (error) {
        if (current === generation.current) {
          setPages((previous) => ({ ...previous, loading: false, error }));
        }
      } finally {
        if (current === generation.current) {
          busy.current = false;
        }
      }
    },
    [key],
  );

  const reload = useCallback(() => {
    generation.current += 1;
    busy.current = false;
    setPages(START);
    void load(0);
  }, [load]);

  useEffect(reload, [reload]);

  const more = pages.total !== undefined && pages.items.length < pages.total && !pages.error;
  // A callback ref kept in state, so the observer re-attaches when the sentinel mounts.
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinel;
    if (!node || !more) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !busy.current) {
          void load(pages.items.length);
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, more, pages.items.length, sentinel]);

  /** Drops a game locally after it left the set on the server. */
  const remove = (id: string) =>
    setPages((previous) => ({
      ...previous,
      items: previous.items.filter((item) => item.id !== id),
      total: previous.total === undefined ? undefined : previous.total - 1,
    }));

  return { ...pages, more, sentinel: setSentinel, reload, remove, retry: () => load(pages.items.length) };
}

interface GameGridProps {
  games: ReturnType<typeof useGamePages>;
  /** Shown when the set has no games. */
  empty: React.ReactNode;
  /** Extra control laid over each poster, for example "Remove from collection". */
  overlay?: (entry: ArchiveEntry) => React.ReactNode;
}

export function GameGrid({ games, empty, overlay }: GameGridProps) {
  if (games.error && games.items.length === 0) {
    return (
      <EmptyState
        title="Couldn't load these games"
        description="The server didn't answer. Check that it's running, then try again."
        action={<Button onClick={games.reload}>Try again</Button>}
      />
    );
  }
  if (!games.loading && games.items.length === 0) {
    return <>{empty}</>;
  }

  return (
    <>
      <PosterGrid>
        {games.items.map((entry) =>
          overlay ? (
            <div key={entry.id} className="group/tile relative">
              <PosterCard entry={entry} />
              {overlay(entry)}
            </div>
          ) : (
            <PosterCard key={entry.id} entry={entry} />
          ),
        )}
        {games.loading && <PosterSkeletons count={games.items.length ? 6 : 12} />}
      </PosterGrid>
      {games.error && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={games.retry}>
            Load more games
          </Button>
        </div>
      )}
      <div ref={(node) => games.sentinel(node)} aria-hidden="true" />
    </>
  );
}
