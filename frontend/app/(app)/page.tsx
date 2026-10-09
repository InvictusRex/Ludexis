"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { archiveApi, collectionsApi, franchisesApi } from "@/lib/api";
import type { ArchiveEntry, Franchise } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { canSeeDashboard } from "@/lib/permissions";
import { plural, year } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Page } from "@/components/shell/page";
import { EmptyState } from "@/components/brand/empty-state";
import { Shot } from "@/components/media/art";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { PosterCard } from "@/components/media/poster-card";
import { PosterSkeletons } from "@/components/media/poster-grid";
import { Shelf } from "@/components/media/shelf";
import { libraryHref } from "@/components/library/library-params";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SHELF_SIZE = 20;
const SLIDES = 5;
const SLIDE_MS = 7000;

const shelf = (query: Parameters<typeof archiveApi.browse>[0]) =>
  archiveApi.browse({ group_versions: true, limit: SHELF_SIZE, ...query });

export default function Home() {
  const { user } = useAuth();

  const recent = useApi(() => shelf({ sort: "-created_at" }), []);
  const rediscover = useApi(() => shelf({ sort: "random" }), []);
  const collections = useApi(async () => {
    const all = await collectionsApi.getAll(0, 20);
    const shown = all.filter((collection) => collection.entry_ids.length > 0).slice(0, 4);
    return Promise.all(
      shown.map(async (collection) => ({ collection, ...(await shelf({ collection_id: collection.id })) })),
    );
  }, []);
  const franchises = useApi(() => franchisesApi.getAll(0, 24), []);

  if (recent.loading && !recent.data) {
    return <HomeSkeleton />;
  }

  if (recent.error) {
    return (
      <Page>
        <h1 className="sr-only">Home</h1>
        <EmptyState
          title="Your library could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={recent.reload}>Try again</Button>}
        />
      </Page>
    );
  }

  if (!recent.data?.total) {
    const dashboard = canSeeDashboard(user);
    return (
      <Page>
        <h1 className="sr-only">Home</h1>
        <EmptyState
          title="No games yet"
          description={
            dashboard
              ? "Add a library folder in Admin Dashboard → Libraries, then run a scan."
              : "Ask an administrator to add a library folder and run a scan."
          }
          action={
            dashboard && (
              <Button asChild>
                <Link href="/admin/libraries">Open Libraries</Link>
              </Button>
            )
          }
        />
      </Page>
    );
  }

  const items = recent.data.items;
  // The slideshow takes random games, those with banner art first; the rest of the pick fills "Rediscover".
  const shuffled = rediscover.data?.items ?? (rediscover.error ? items : []);
  const slides = [...shuffled.filter((entry) => entry.banner_path), ...shuffled.filter((entry) => !entry.banner_path)].slice(
    0,
    SLIDES,
  );
  const slideIds = new Set(slides.map((entry) => entry.id));
  const unfeatured = shuffled.filter((entry) => !slideIds.has(entry.id));
  // A small library (or one narrowed by user access) can fit wholly in the slideshow; then the row repeats the pick.
  const rediscoverItems = unfeatured.length > 0 ? unfeatured : shuffled;
  const franchiseList = (franchises.data?.items ?? []).filter((franchise) => franchise.entry_count > 0);

  return (
    <>
      <h1 className="sr-only">Home</h1>
      {slides.length > 0 ? <Showcase entries={slides} /> : <HeroSkeleton />}

      <div className="pb-16 pt-4">
        <Shelf title="Recently added" href={libraryHref({ sort: "-created_at" })}>
          {items.map((entry) => (
            <PosterCard key={entry.id} entry={entry} />
          ))}
        </Shelf>

        {/* A shuffled pick, so games that left the "Recently added" row come back into view. */}
        {rediscoverItems.length > 0 && (
          <Shelf title="Rediscover">
            {rediscoverItems.map((entry) => (
              <PosterCard key={entry.id} entry={entry} />
            ))}
          </Shelf>
        )}

        {collections.data?.map(({ collection, items: games }) =>
          games.length ? (
            <Shelf key={collection.id} title={collection.name} href={`/collections/${collection.id}`}>
              {games.map((entry) => (
                <PosterCard key={entry.id} entry={entry} />
              ))}
            </Shelf>
          ) : null,
        )}

        {franchiseList.length > 0 && (
          <Shelf title="Franchises" href="/franchises" itemClassName="w-[220px] sm:w-[260px]">
            {franchiseList.map((franchise) => (
              <FranchiseCard key={franchise.id} franchise={franchise} />
            ))}
          </Shelf>
        )}
      </div>
    </>
  );
}

/** A Steam-style slideshow: advances on its own, holds while hovered or focused, and has arrows, dots and pause. */
function Showcase({ entries }: { entries: ArchiveEntry[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [paused, setPaused] = useState(false);
  const count = entries.length;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || held || count < 2) return;
    const timer = setTimeout(() => setIndex((current) => (current + 1) % count), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, held, count]);

  const current = Math.min(index, count - 1);
  const step = (by: number) => setIndex((value) => (value + by + count) % count);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured games"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHeld(false)}
    >
      <Spotlight key={entries[current].id} entry={entries[current]}>
        {count > 1 && (
          <>
            <SlideArrow side="left" onClick={() => step(-1)} />
            <SlideArrow side="right" onClick={() => step(1)} />
            <div className="relative mt-6 flex items-center justify-center gap-2">
              {entries.map((slide, slideIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  aria-label={`Show game ${slideIndex + 1} of ${count}`}
                  aria-current={slideIndex === current ? "true" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    slideIndex === current ? "w-6 bg-parchment" : "w-1.5 bg-parchment/40 hover:bg-parchment/70",
                  )}
                />
              ))}
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                className="ml-2 grid size-7 place-items-center rounded-full text-parchment/70 hover:bg-night/50 hover:text-parchment"
              >
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
            </div>
          </>
        )}
      </Spotlight>
    </div>
  );
}

function SlideArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous game" : "Next game"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-night/50 text-parchment backdrop-blur transition-colors hover:bg-night/80",
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4",
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}

function Spotlight({ entry, children }: { entry: ArchiveEntry; children?: React.ReactNode }) {
  const meta = [year(entry.release_date), ...(entry.genres ?? []).slice(0, 3)].filter(Boolean);
  return (
    <BackdropHero
      banner={entry.banner_path}
      cover={entry.cover_path}
      size="spotlight"
      className="animate-in fade-in duration-700 motion-reduce:animate-none"
    >
      {/* Without banner art the backdrop is only a blur, so the knight keeps watch in the corner. */}
      {!entry.banner_path && (
        <img
          src="/brand/knight.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-(--gutter) hidden w-64 opacity-[0.08] md:block lg:w-80"
        />
      )}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-12 text-center">
        <p className="mb-3 text-sm font-medium text-ash">Featured</p>
        {/* Every block keeps a fixed height (two title lines, one meta line, two description lines), so slides never resize the hero. */}
        <h2 className="flex h-[2.5em] items-end justify-center font-display text-3xl font-semibold leading-tight text-parchment sm:text-5xl">
          <span className="line-clamp-2 text-balance">{entry.title}</span>
        </h2>
        <p className="mt-3 h-5 truncate text-sm text-ash">{meta.join(" · ")}</p>
        <p className="mt-3 line-clamp-2 h-12 max-w-[60ch] text-parchment/85">{entry.description}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href={`/archive/${entry.id}`}>View game</Link>
        </Button>
      </div>
      {children}
    </BackdropHero>
  );
}

function FranchiseCard({ franchise }: { franchise: Franchise }) {
  return (
    <Link href={`/franchises/${franchise.id}`} className="group block rounded-md outline-none">
      <div className="relative rounded-md transition-shadow group-hover:shadow-[0_0_0_1px_var(--violet-lit)] group-focus-visible:shadow-[0_0_0_2px_var(--violet-lit)]">
        <Shot path={franchise.banner_path} alt="" className="bg-[radial-gradient(120%_120%_at_30%_20%,rgb(91_53_163/0.45),var(--stone)_70%)]" />
        <div className="absolute inset-0 flex items-end rounded-md bg-gradient-to-t from-night/90 via-night/30 to-transparent p-3">
          <span className="line-clamp-2 font-display text-base font-semibold text-parchment">{franchise.name}</span>
        </div>
      </div>
      <p className="mt-2 px-0.5 text-xs tabular text-ash">{plural(franchise.entry_count, "game")}</p>
    </Link>
  );
}

function HeroSkeleton() {
  return (
    <div className="-mt-(--topbar-h) flex min-h-[clamp(300px,46vh,480px)] flex-col items-center justify-end gap-4 bg-vault pb-10">
      <Skeleton className="h-12 w-72 max-w-[80%]" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-11 w-32" />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <>
      <h1 className="sr-only">Home</h1>
      <HeroSkeleton />
      {[0, 1].map((row) => (
        <div key={row} className="px-(--gutter) py-3">
          <Skeleton className="mb-4 h-6 w-44" />
          <div className="flex gap-4 overflow-hidden sm:gap-5">
            <div className="flex gap-4 [&>*]:w-[132px] [&>*]:shrink-0 sm:gap-5 sm:[&>*]:w-[156px]">
              <PosterSkeletons count={8} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
