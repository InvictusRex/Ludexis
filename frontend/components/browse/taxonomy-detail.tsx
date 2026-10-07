"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, LibraryBig, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { ApiError } from "@/lib/errors";
import { plural } from "@/lib/format";
import { can } from "@/lib/permissions";
import { toastSuccess } from "@/lib/toast";
import { EmptyState } from "@/components/brand/empty-state";
import { PosterGrid, PosterSkeletons } from "@/components/media/poster-grid";
import { Page, PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { GameGrid, useGamePages } from "./game-grid";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";
import { TAXONOMIES, capitalize, type TaxonomyKey, type TaxonomyKind } from "./taxonomy-config";

/** One developer (or publisher, franchise, tag): its details and its games, from `/search/`. */
export function TaxonomyDetail({ kind: key }: { kind: TaxonomyKey }) {
  const kind: TaxonomyKind = TAXONOMIES[key];
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const item = useApi(() => kind.api.getById(id), [key, id]);
  const games = useGamePages(
    item.data ? { [kind.filter]: item.data.name, group_versions: true, sort: kind.sort } : null,
  );

  const back = (
    <Link
      href={`/${kind.path}`}
      className="mb-4 inline-flex items-center gap-1 text-sm text-ash hover:text-parchment"
    >
      <ChevronLeft className="size-4" />
      {capitalize(kind.plural)}
    </Link>
  );

  if (item.error) {
    const missing = item.error instanceof ApiError && item.error.status === 404;
    return (
      <Page>
        {back}
        <EmptyState
          title={missing ? `This ${kind.singular} doesn't exist` : `Couldn't load this ${kind.singular}`}
          description={
            missing
              ? "It may have been deleted or merged into another one."
              : "The server didn't answer. Check that it's running, then try again."
          }
          action={
            missing ? (
              <Button asChild>
                <Link href={`/${kind.path}`}>Browse {kind.plural}</Link>
              </Button>
            ) : (
              <Button onClick={item.reload}>Try again</Button>
            )
          }
        />
      </Page>
    );
  }

  if (!item.data) {
    return (
      <Page>
        {back}
        <div aria-hidden="true" className="mb-8">
          <div className="h-9 w-72 max-w-full animate-pulse rounded-md bg-stone" />
          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-stone" />
        </div>
        <PosterGrid>
          <PosterSkeletons />
        </PosterGrid>
      </Page>
    );
  }

  const { name, description, website, color } = item.data;
  const site = hostname(website);
  const count = games.total ?? item.data.entry_count;
  const canEdit = can(user, kind.permission);
  const libraryHref = `/library?${new URLSearchParams({ [kind.filter]: name })}`;

  return (
    <Page>
      {back}
      <PageHeader
        title={name}
        description={
          <>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {color && <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: color }} />}
              <span className="tabular">{plural(count, "game")}</span>
              {site && (
                <a
                  href={website ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-violet-lit hover:text-parchment"
                >
                  {site}
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </span>
            {description && <span className="mt-3 block max-w-[70ch] whitespace-pre-line">{description}</span>}
          </>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={libraryHref}>
                <LibraryBig />
                Open in library
              </Link>
            </Button>
            {canEdit && (
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
          </>
        }
      />

      <GameGrid
        games={games}
        empty={
          <EmptyState
            title="No games yet"
            description={`No game is linked to this ${kind.singular}. Identify a game or edit its details to add one.`}
          />
        }
      />

      <TaxonomyFormDialog
        open={editing}
        onOpenChange={setEditing}
        title={`Edit ${kind.singular}`}
        description={`Changes apply to every game linked to ${name}.`}
        fields={kind.fields}
        initial={item.data}
        onSubmit={async (values) => {
          item.setData(await kind.api.update(id, values));
          toastSuccess("Changes saved");
        }}
      />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete ${name}?`}
        description={`The games stay in your library; they just lose this ${kind.singular}.`}
        confirmLabel={`Delete ${kind.singular}`}
        onConfirm={async () => {
          await kind.api.delete(id);
          toastSuccess(`${capitalize(kind.singular)} deleted`);
          router.push(`/${kind.path}`);
        }}
      />
    </Page>
  );
}

/** The host of an http(s) link, or nothing for anything else (including `javascript:`). */
function hostname(url?: string | null): string | undefined {
  if (!url || !/^https?:\/\//i.test(url)) {
    return undefined;
  }
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}
