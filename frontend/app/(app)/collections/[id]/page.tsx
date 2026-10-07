"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, LibraryBig, Pencil, Trash2, X } from "lucide-react";
import { collectionsApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/errors";
import { plural } from "@/lib/format";
import { can } from "@/lib/permissions";
import { toast, toastError, toastSuccess } from "@/lib/toast";
import { EmptyState } from "@/components/brand/empty-state";
import { ConfirmDialog } from "@/components/browse/confirm-dialog";
import { CollectionDialog } from "@/components/browse/collection-dialog";
import { GameGrid, useGamePages } from "@/components/browse/game-grid";
import { BackdropHero } from "@/components/media/backdrop-hero";
import { PosterGrid, PosterSkeletons } from "@/components/media/poster-grid";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";

const back = (
  <Link href="/collections" className="mb-4 inline-flex items-center gap-1 text-sm text-ash hover:text-parchment">
    <ChevronLeft className="size-4" />
    Collections
  </Link>
);

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const collection = useApi(() => collectionsApi.getById(id), [id]);
  // /search/ matches collections by name.
  const games = useGamePages(collection.data ? { collection_id: collection.data.id, sort: "title" } : null);
  const canManage = can(user, "MANAGE_COLLECTIONS");

  if (collection.error) {
    const missing = collection.error instanceof ApiError && collection.error.status === 404;
    return (
      <Page>
        {back}
        <EmptyState
          title={missing ? "This collection doesn't exist" : "Couldn't load this collection"}
          description={
            missing ? "It may have been deleted." : "The server didn't answer. Check that it's running, then try again."
          }
          action={
            missing ? (
              <Button asChild>
                <Link href="/collections">Browse collections</Link>
              </Button>
            ) : (
              <Button onClick={collection.reload}>Try again</Button>
            )
          }
        />
      </Page>
    );
  }

  const data = collection.data;

  const removeGame = async (entry: ArchiveEntry) => {
    try {
      await collectionsApi.removeEntry(id, entry.id);
      games.remove(entry.id);
      toast.success(`Removed ${entry.title}`, {
        action: {
          label: "Undo",
          onClick: () =>
            collectionsApi.addEntry(id, entry.id).then(games.reload, (error) => toastError(error, "Couldn't add it back")),
        },
      });
    } catch (error) {
      toastError(error, "Couldn't remove the game");
    }
  };

  return (
    <>
      <BackdropHero size="banner" banner={data?.banner_path} cover={data?.cover_path ?? games.items[0]?.cover_path}>
        {back}
        {data ? (
          <>
            <h1 className="font-display text-3xl font-semibold text-parchment sm:text-4xl">{data.name}</h1>
            <p className="mt-2 text-sm text-parchment/80 tabular">
              {plural(games.total ?? data.entry_ids.length, "game")}
              {data.visibility === "private" && " · Private"}
            </p>
            {data.description && (
              <p className="mt-3 max-w-[70ch] whitespace-pre-line text-parchment/85">{data.description}</p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/library?${new URLSearchParams({ collection: data.name })}`}>
                  <LibraryBig />
                  Open in library
                </Link>
              </Button>
              {canManage && (
                <>
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleting(true)} className="text-ember hover:text-ember">
                    <Trash2 />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </>
        ) : (
          <div aria-hidden="true">
            <div className="h-10 w-80 max-w-full animate-pulse rounded-md bg-stone/70" />
            <div className="mt-3 h-4 w-24 animate-pulse rounded bg-stone/70" />
          </div>
        )}
      </BackdropHero>

      <Page>
        <h2 className="mb-5 font-display text-lg font-semibold text-parchment">Games in this collection</h2>
        {data ? (
          <GameGrid
            games={games}
            empty={
              <EmptyState
                title="No games in this collection yet"
                description="Add games from a game's page, or select several in the library."
                action={
                  <Button asChild>
                    <Link href="/library">Go to the library</Link>
                  </Button>
                }
              />
            }
            overlay={
              canManage
                ? (entry) => (
                    <button
                      type="button"
                      onClick={() => removeGame(entry)}
                      aria-label={`Remove ${entry.title} from this collection`}
                      title="Remove from collection"
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-night/85 text-parchment opacity-0 backdrop-blur transition-opacity hover:bg-ember hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-violet-lit group-hover/tile:opacity-100 [@media(pointer:coarse)]:opacity-100"
                    >
                      <X className="size-4" />
                    </button>
                  )
                : undefined
            }
          />
        ) : (
          <PosterGrid>
            <PosterSkeletons />
          </PosterGrid>
        )}
      </Page>

      {data && (
        <>
          <CollectionDialog open={editing} onOpenChange={setEditing} collection={data} onSaved={collection.setData} />
          <ConfirmDialog
            open={deleting}
            onOpenChange={setDeleting}
            title={`Delete ${data.name}?`}
            description="The games stay in your library; only the collection goes."
            confirmLabel="Delete collection"
            onConfirm={async () => {
              await collectionsApi.remove(id);
              toastSuccess("Collection deleted");
              router.push("/collections");
            }}
          />
        </>
      )}
    </>
  );
}
