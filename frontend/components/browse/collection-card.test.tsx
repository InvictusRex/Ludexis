import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { archiveApi } from "@/lib/api";
import type { Collection } from "@/lib/types";
import { CollectionCard } from "./collection-card";

vi.mock("@/lib/api", () => ({ archiveApi: { browse: vi.fn() } }));

const collection = (overrides: Partial<Collection> = {}): Collection => ({
  id: "c1",
  name: "Favorites",
  description: "Games I keep coming back to",
  entry_ids: ["e1", "e2"],
  ...overrides,
});

describe("CollectionCard", () => {
  afterEach(cleanup);

  it("links to the collection with its name, game count and description", () => {
    render(<CollectionCard collection={collection({ banner_path: "banners/fav.jpg" })} />);

    const link = screen.getByRole("link", { name: /Favorites/ });
    expect(link).toHaveAttribute("href", "/collections/c1");
    expect(screen.getByText("2 games")).toBeInTheDocument();
    expect(screen.getByText("Games I keep coming back to")).toBeInTheDocument();
    expect(archiveApi.browse).not.toHaveBeenCalled();
  });

  it("builds a mosaic from the first four games, matched by collection id, when there is no banner", async () => {
    vi.mocked(archiveApi.browse).mockResolvedValue({
      items: [{ id: "e1", title: "Portal", cover_path: null } as never],
      total: 2,
    });
    render(<CollectionCard collection={collection()} />);

    await waitFor(() => expect(screen.getByText("Portal")).toBeInTheDocument());
    expect(archiveApi.browse).toHaveBeenCalledWith({ collection_id: "c1", limit: 4 });
  });

  it("skips the request for an empty collection", () => {
    render(<CollectionCard collection={collection({ entry_ids: [] })} />);

    expect(screen.getByText("0 games")).toBeInTheDocument();
    expect(archiveApi.browse).not.toHaveBeenCalled();
  });
});
