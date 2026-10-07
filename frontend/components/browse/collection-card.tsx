"use client";

import Link from "next/link";
import { LibraryBig, Lock } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { Poster, Shot } from "@/components/media/art";

/** A wide card: the collection's banner, or a 2×2 mosaic of its first covers. */
export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.id}`} className="group block rounded-[10px] outline-none">
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-[10px] transition-shadow duration-200 group-hover:shadow-[0_0_0_1px_var(--violet-lit),0_12px_32px_-12px_rgb(91_53_163/0.5)] group-focus-visible:shadow-[0_0_0_2px_var(--violet-lit)]"
      >
        {collection.banner_path ? (
          <Shot path={collection.banner_path} alt="" className="rounded-none" />
        ) : (
          <CollectionMosaic collection={collection} />
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
        <h2 className="flex min-w-0 items-center gap-1.5 font-medium text-parchment group-hover:text-white">
          <span className="truncate">{collection.name}</span>
          {collection.visibility === "private" && (
            <Lock className="size-3.5 shrink-0 text-ash" aria-label="Private" />
          )}
        </h2>
        <span className="shrink-0 text-sm text-ash tabular">{plural(collection.entry_ids.length, "game")}</span>
      </div>
      <p className="mt-0.5 h-[1.45em] truncate px-0.5 text-sm text-ash">{collection.description}</p>
    </Link>
  );
}

function CollectionMosaic({ collection }: { collection: Collection }) {
  const empty = collection.entry_ids.length === 0;
  // one small /search/ request per bannerless card; fine for dozens of
  // collections, defer to an IntersectionObserver if someone keeps hundreds.
  const covers = useApi(
    () =>
      empty
        ? Promise.resolve([])
        : archiveApi.browse({ collection_id: collection.id, limit: 4 }).then((page) => page.items),
    [collection.name, empty],
  );

  if (empty) {
    return (
      <div className="grid aspect-video place-items-center bg-[radial-gradient(90%_120%_at_50%_0%,rgb(91_53_163/0.45),var(--vault)_70%)]">
        <LibraryBig className="size-10 text-violet-lit/60" strokeWidth={1.5} />
      </div>
    );
  }

  const tiles = covers.data ?? [];
  return (
    <div className="grid aspect-video grid-cols-2 grid-rows-2 gap-0.5 bg-night">
      {[0, 1, 2, 3].map((index) => {
        const entry = tiles[index];
        return entry ? (
          <Poster key={entry.id} path={entry.cover_path} alt={entry.title} className="aspect-auto size-full rounded-none" />
        ) : (
          <div key={index} className="bg-stone" />
        );
      })}
    </div>
  );
}

export function CollectionCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-video animate-pulse rounded-[10px] bg-stone" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-stone" />
      <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-stone" />
    </div>
  );
}
