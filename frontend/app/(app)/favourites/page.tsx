"use client";

import Link from "next/link";
import { plural } from "@/lib/format";
import { EmptyState } from "@/components/brand/empty-state";
import { GameGrid, useGamePages } from "@/components/browse/game-grid";
import { Page, PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";

const QUERY = { favorite: true, group_versions: true, sort: "title" } as const;

export default function FavouritesPage() {
  const games = useGamePages(QUERY);

  return (
    <Page>
      <PageHeader
        title="Favourites"
        description={games.total ? plural(games.total, "game") : undefined}
      />
      <GameGrid
        games={games}
        empty={
          <EmptyState
            title="No favourites yet"
            description="Open a game and choose Add to favourites; it shows up here and gets a star in the library."
            action={
              <Button asChild>
                <Link href="/library">Browse the library</Link>
              </Button>
            }
          />
        }
      />
    </Page>
  );
}
