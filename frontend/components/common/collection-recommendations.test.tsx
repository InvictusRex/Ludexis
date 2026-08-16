import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { archiveApi, collectionsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { CollectionRecommendations } from "./collection-recommendations";
import type { ArchiveEntry, Collection } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  collectionsApi: {
    getAll: vi.fn(),
  },
  archiveApi: {
    getAll: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

const makeEntry = (
  id: string,
  tagIds: string[],
  developerIds: string[] = [],
): ArchiveEntry => ({
  id,
  title: `Entry ${id}`,
  file_path: `/archive/${id}.zip`,
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "VERIFIED",
  related_entry_ids: [],
  tag_ids: tagIds,
  developer_ids: developerIds,
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

const makeCollection = (
  id: string,
  name: string,
  entryIds: string[],
): Collection => ({
  id,
  name,
  entry_ids: entryIds,
});

const currentEntries = [makeEntry("e1", ["rpg", "fantasy"], ["dev-a"])];

const allEntries = [
  ...currentEntries,
  makeEntry("e2", ["rpg", "fantasy"], ["dev-a"]),
  makeEntry("e3", ["rpg"], ["dev-b"]),
  makeEntry("e4", ["puzzle"], ["dev-c"]),
];

const collections = [
  makeCollection("c1", "Current Collection", ["e1"]),
  makeCollection("c2", "Strong Match", ["e2"]),
  makeCollection("c3", "Weak Match", ["e3"]),
  makeCollection("c4", "No Match", ["e4"]),
];

describe("CollectionRecommendations", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("ranks overlapping collections by similarity and excludes the current one", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue(collections);
    vi.mocked(archiveApi.getAll).mockResolvedValue(allEntries);

    render(
      <CollectionRecommendations collectionId="c1" entries={currentEntries} />,
    );

    expect(await screen.findByText("Strong Match")).toBeInTheDocument();
    expect(screen.getByText("Weak Match")).toBeInTheDocument();
    expect(screen.queryByText("No Match")).not.toBeInTheDocument();
    expect(screen.queryByText("Current Collection")).not.toBeInTheDocument();

    const names = screen
      .getAllByRole("link")
      .map((link) => link.textContent ?? "");
    expect(names[0]).toContain("Strong Match");
    expect(names[1]).toContain("Weak Match");
  });

  it("links each recommendation to its collection detail page", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue(collections);
    vi.mocked(archiveApi.getAll).mockResolvedValue(allEntries);

    render(
      <CollectionRecommendations collectionId="c1" entries={currentEntries} />,
    );

    await screen.findByText("Strong Match");
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/collections/c2");
    expect(links[1]).toHaveAttribute("href", "/collections/c3");
  });

  it("explains the overlap reason and match percentage", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue(collections);
    vi.mocked(archiveApi.getAll).mockResolvedValue(allEntries);

    render(
      <CollectionRecommendations collectionId="c1" entries={currentEntries} />,
    );

    expect(
      await screen.findByText("Shares 2 tags · 1 developer"),
    ).toBeInTheDocument();
    expect(screen.getByText("100% match")).toBeInTheDocument();
    expect(screen.getByText("Shares 1 tag")).toBeInTheDocument();
  });

  it("shows an empty state when nothing overlaps", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue([
      makeCollection("c1", "Current Collection", ["e1"]),
      makeCollection("c4", "No Match", ["e4"]),
    ]);
    vi.mocked(archiveApi.getAll).mockResolvedValue(allEntries);

    render(
      <CollectionRecommendations collectionId="c1" entries={currentEntries} />,
    );

    expect(
      await screen.findByText("No similar collections yet"),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the current collection has no tags or developers", async () => {
    vi.mocked(collectionsApi.getAll).mockResolvedValue(collections);
    vi.mocked(archiveApi.getAll).mockResolvedValue(allEntries);

    render(
      <CollectionRecommendations
        collectionId="c1"
        entries={[makeEntry("e9", [], [])]}
      />,
    );

    expect(
      await screen.findByText("No similar collections yet"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when loading fails", async () => {
    vi.mocked(collectionsApi.getAll).mockRejectedValue(new Error("network"));
    vi.mocked(archiveApi.getAll).mockRejectedValue(new Error("network"));

    render(
      <CollectionRecommendations collectionId="c1" entries={currentEntries} />,
    );

    expect(
      await screen.findByText(
        "Failed to load recommendations. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
