"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { can } from "@/lib/permissions";
import { toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/brand/empty-state";
import { Page, PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxonomyFormDialog } from "./taxonomy-form-dialog";
import {
  LETTERS,
  TAXONOMIES,
  capitalize,
  fetchAll,
  groupByLetter,
  type TaxonomyItem,
  type TaxonomyKey,
  type TaxonomyKind,
} from "./taxonomy-config";

const anchor = (letter: string) => `letter-${letter === "#" ? "0" : letter}`;

/** Every developer (or publisher, franchise, tag) A–Z, with a jump bar and a name filter. */
export function TaxonomyIndex({ kind: key }: { kind: TaxonomyKey }) {
  const kind: TaxonomyKind = TAXONOMIES[key];
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  // loads every name (500 per request) so the A–Z bar and filter are instant;
  // move to server `q` paging if a list ever reaches tens of thousands.
  const list = useApi(() => fetchAll((offset, limit) => kind.api.getAll(offset, limit).then((page) => page.items)), [key]);

  const groups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const items = list.data ?? [];
    return groupByLetter(needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items);
  }, [filter, list.data]);

  const canEdit = can(user, kind.permission);
  const addButton = canEdit && (
    <Button onClick={() => setCreating(true)}>
      <Plus />
      Add {kind.singular}
    </Button>
  );

  let content: React.ReactNode;
  if (list.error) {
    content = (
      <EmptyState
        title={`Couldn't load ${kind.plural}`}
        description="The server didn't answer. Check that it's running, then try again."
        action={<Button onClick={list.reload}>Try again</Button>}
      />
    );
  } else if (!list.data) {
    content = <IndexSkeleton />;
  } else if (list.data.length === 0) {
    content = (
      <EmptyState
        title={`No ${kind.plural} yet`}
        description={`${capitalize(kind.plural)} fill in as games are identified${canEdit ? ", or add one yourself" : ""}.`}
        action={addButton}
      />
    );
  } else {
    const present = new Set(groups.map((group) => group.letter));
    content = (
      <>
        <div className="sticky top-(--topbar-h) z-20 -mx-(--gutter) mb-2 flex flex-col gap-3 border-b border-seam bg-night/90 px-(--gutter) py-3 backdrop-blur-md md:flex-row md:items-center">
          <div className="relative md:w-64 md:shrink-0">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ash" />
            <Input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={`Filter ${kind.plural}`}
              aria-label={`Filter ${kind.plural}`}
              className="pl-9"
            />
          </div>
          <nav aria-label="Jump to letter" className="-mx-1 flex min-w-0 overflow-x-auto px-1">
            {LETTERS.map((letter) =>
              present.has(letter) ? (
                <a
                  key={letter}
                  href={`#${anchor(letter)}`}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-sm font-semibold text-parchment hover:bg-stone hover:text-violet-lit focus-visible:outline-2 focus-visible:outline-violet-lit"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  aria-disabled="true"
                  className="grid size-8 shrink-0 place-items-center text-sm text-ash/35"
                >
                  {letter}
                </span>
              ),
            )}
          </nav>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            title={`No ${kind.plural} match “${filter.trim()}”`}
            description="Try a shorter or different name."
            action={
              <Button variant="outline" onClick={() => setFilter("")}>
                Clear filter
              </Button>
            }
          />
        ) : (
          groups.map(({ letter, items }) => (
            <section
              key={letter}
              id={anchor(letter)}
              aria-labelledby={`${anchor(letter)}-heading`}
              className="grid scroll-mt-[calc(var(--topbar-h)+7.5rem)] gap-x-6 gap-y-2 border-b border-seam/60 py-5 last:border-b-0 sm:grid-cols-[2.5rem_1fr] md:scroll-mt-[calc(var(--topbar-h)+4.5rem)]"
            >
              <h2 id={`${anchor(letter)}-heading`} className="font-display text-2xl font-semibold leading-9 text-violet-lit">
                {letter}
              </h2>
              {kind.chips ? <ChipList kind={kind} items={items} /> : <RowList kind={kind} items={items} />}
            </section>
          ))
        )}
      </>
    );
  }

  return (
    <Page>
      <PageHeader
        title={capitalize(kind.plural)}
        description={list.data && list.data.length > 0 ? plural(list.data.length, kind.singular, kind.plural) : undefined}
        actions={list.data && list.data.length > 0 ? addButton : undefined}
      />
      {content}
      <TaxonomyFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`Add ${kind.singular}`}
        description={`The new ${kind.singular} can then be linked to games.`}
        fields={kind.fields}
        onSubmit={async (values) => {
          const created = await kind.api.create(values);
          toastSuccess(`${capitalize(kind.singular)} added`);
          router.push(`/${kind.path}/${created.id}`);
        }}
      />
    </Page>
  );
}

function GameCount({ count }: { count: number }) {
  return (
    <span className="shrink-0 text-sm text-ash tabular">
      {count}
      <span className="sr-only"> {count === 1 ? "game" : "games"}</span>
    </span>
  );
}

function RowList({ kind, items }: { kind: TaxonomyKind; items: TaxonomyItem[] }) {
  return (
    <ul className="columns-1 gap-x-8 sm:columns-2 xl:columns-3">
      {items.map((item) => (
        <li key={item.id} className="break-inside-avoid">
          <Link
            href={`/${kind.path}/${item.id}`}
            className="flex items-baseline justify-between gap-4 rounded-md px-3 py-2 hover:bg-vault focus-visible:outline-2 focus-visible:outline-violet-lit"
          >
            <span className={cn("truncate", item.entry_count ? "text-parchment" : "text-ash")}>{item.name}</span>
            <GameCount count={item.entry_count} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ kind, items }: { kind: TaxonomyKind; items: TaxonomyItem[] }) {
  return (
    <ul className="flex flex-wrap gap-2 py-0.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/${kind.path}/${item.id}`}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-seam bg-vault px-3 text-sm text-parchment hover:border-violet-lit/60 hover:bg-stone focus-visible:outline-2 focus-visible:outline-violet-lit"
          >
            {item.color && (
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            {item.name}
            <GameCount count={item.entry_count} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function IndexSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-6 h-10 w-64 max-w-full animate-pulse rounded-lg bg-stone" />
      <div className="columns-1 gap-x-8 sm:columns-2 xl:columns-3">
        {Array.from({ length: 18 }, (_, index) => (
          <div key={index} className="mb-2 h-9 animate-pulse rounded-md bg-vault" />
        ))}
      </div>
    </div>
  );
}
