"use client";

import Link from "next/link";
import { archiveApi, artworkApi, collectionsApi, franchisesApi } from "@/lib/api";
import type { ArchiveEntry, Franchise } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { can, canSeeDashboard } from "@/lib/permissions";
import { plural, year } from "@/lib/format";
import { Page } from "@/components/shell/page";
import { EmptyState } from "@/components/brand/empty-state";
import { Logo, Shot } from "@/components/media/art";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { PosterCard } from "@/components/media/poster-card";
import { PosterSkeletons } from "@/components/media/poster-grid";
import { Shelf } from "@/components/media/shelf";
import { libraryHref } from "@/components/library/library-params";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const SHELF_SIZE = 20;

const shelf = (query: Parameters<typeof archiveApi.browse>[0]) =>
  archiveApi.browse({ group_versions: true, limit: SHELF_SIZE, ...query });

export default function Home() {
  const { user } = useAuth();
  const canEdit = can(user, "EDIT_METADATA");

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
  const spotlight = items.find((entry) => entry.banner_path) ?? items[0];
  const franchiseList = (franchises.data?.items ?? []).filter((franchise) => franchise.entry_count > 0);

  return (
    <>
      <h1 className="sr-only">Home</h1>
      <Spotlight entry={spotlight} />

      <div className="pb-16 pt-4">
        {canEdit && <NeedsAttention />}

        <Shelf title="Recently added" href={libraryHref({ sort: "-created_at" })}>
          {items.map((entry) => (
            <PosterCard key={entry.id} entry={entry} />
          ))}
        </Shelf>

        {/* A shuffled pick, so games that left the "Recently added" row come back into view. */}
        {!!rediscover.data?.items.length && (
          <Shelf title="Rediscover">
            {rediscover.data.items.map((entry) => (
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

function Spotlight({ entry }: { entry: ArchiveEntry }) {
  const meta = [year(entry.release_date), ...(entry.genres ?? []).slice(0, 3)].filter(Boolean);
  return (
    <BackdropHero banner={entry.banner_path} cover={entry.cover_path} size="spotlight">
      {/* Without banner art the backdrop is only a blur, so the knight keeps watch in the corner. */}
      {!entry.banner_path && (
        <img
          src="/brand/knight.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-(--gutter) hidden w-64 opacity-[0.08] md:block lg:w-80"
        />
      )}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="mb-3 text-sm font-medium text-ash">Newly added</p>
        <h2 className="flex justify-center">
          <Logo
            path={entry.logo_path}
            alt={entry.title}
            className="h-24 w-auto object-center sm:h-32"
            fallback={
              <span className="font-display text-3xl font-semibold leading-tight text-parchment text-balance sm:text-5xl">
                {entry.title}
              </span>
            }
          />
        </h2>
        {meta.length > 0 && <p className="mt-3 text-sm text-ash">{meta.join(" · ")}</p>}
        {entry.description && (
          <p className="mt-3 line-clamp-2 max-w-[60ch] text-parchment/85">{entry.description}</p>
        )}
        <Button asChild size="lg" className="mt-6">
          <Link href={`/archive/${entry.id}`}>View game</Link>
        </Button>
      </div>
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

/** Quiet counts for editors, each opening the matching Dashboard tab. */
function NeedsAttention() {
  const counts = useApi(async () => {
    const [unmatched, partial, missing, duplicates] = await Promise.all([
      archiveApi.browse({ metadata_status: "UNMATCHED", limit: 1 }),
      archiveApi.browse({ metadata_status: "PARTIAL", limit: 1 }),
      // these two endpoints return full lists (no paging or count header); fine at homelab scale.
      artworkApi.getMissing(),
      archiveApi.getDuplicates(),
    ]);
    return [
      { href: "/admin/metadata?tab=review", label: plural(unmatched.total + partial.total, "game") + " to identify", count: unmatched.total + partial.total },
      { href: "/admin/metadata?tab=artwork", label: plural(missing.length, "game") + " missing artwork", count: missing.length },
      { href: "/admin/metadata?tab=duplicates", label: plural(duplicates.length, "duplicate group"), count: duplicates.length },
    ].filter((item) => item.count > 0);
  }, []);

  if (!counts.data?.length) {
    return null;
  }
  return (
    <section aria-label="Needs attention" className="mx-(--gutter) mb-2 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-seam bg-vault px-4 py-3 text-sm">
      <span className="font-medium text-parchment">Needs attention</span>
      {counts.data.map((item) => (
        <Link key={item.href} href={item.href} className="tabular text-violet-lit hover:text-parchment">
          {item.label}
        </Link>
      ))}
    </section>
  );
}

function HomeSkeleton() {
  return (
    <>
      <h1 className="sr-only">Home</h1>
      <div className="-mt-(--topbar-h) flex min-h-[clamp(300px,46vh,480px)] flex-col items-center justify-end gap-4 bg-vault pb-10">
        <Skeleton className="h-12 w-72 max-w-[80%]" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-11 w-32" />
      </div>
      {[0, 1].map((row) => (
        <div key={row} className="px-(--gutter) py-4">
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
