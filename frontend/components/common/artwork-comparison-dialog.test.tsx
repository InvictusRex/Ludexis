import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ArtworkComparisonDialog,
  buildArtworkOptions,
} from "./artwork-comparison-dialog";
import type { ArchiveEntry, Screenshot } from "@/lib/types";

vi.mock("@/lib/media", () => ({
  mediaUrl: (path?: string | null) => (path ? `/media/${path}` : undefined),
}));

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "entry-1",
  title: "Portal",
  file_path: "/archive/portal.zip",
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "VERIFIED",
  related_entry_ids: [],
  tag_ids: [],
  developer_ids: [],
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const entryWithArt = makeEntry({
  cover_path: "covers/portal.png",
  banner_path: "banners/portal.png",
});

const screenshots: Screenshot[] = [
  {
    id: "s1",
    archive_entry_id: "entry-1",
    file_path: "screenshots/one.png",
    caption: "Test chamber",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "s2",
    archive_entry_id: "entry-1",
    file_path: "screenshots/two.png",
    created_at: "2026-01-02T00:00:00Z",
  },
];

describe("buildArtworkOptions", () => {
  it("includes only the artwork assets present on the entry", () => {
    expect(buildArtworkOptions(makeEntry())).toEqual([]);
    expect(
      buildArtworkOptions(entryWithArt).map((option) => option.label),
    ).toEqual(["Cover", "Banner"]);
  });

  it("labels screenshots by caption or position", () => {
    const options = buildArtworkOptions(entryWithArt, screenshots);
    expect(options.map((option) => option.label)).toEqual([
      "Cover",
      "Banner",
      "Test chamber",
      "Screenshot 2",
    ]);
  });
});

describe("ArtworkComparisonDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("disables the trigger when the entry has no artwork", () => {
    render(<ArtworkComparisonDialog entry={makeEntry()} />);

    expect(
      screen.getByRole("button", { name: /compare artwork/i }),
    ).toBeDisabled();
  });

  it("renders two artwork panes side-by-side when opened", async () => {
    const user = userEvent.setup();

    render(
      <ArtworkComparisonDialog entry={entryWithArt} screenshots={screenshots} />,
    );

    await user.click(screen.getByRole("button", { name: /compare artwork/i }));

    expect(
      await screen.findByRole("dialog", { name: "Compare Artwork" }),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Left: Cover")).toHaveAttribute(
      "src",
      "/media/covers/portal.png",
    );
    expect(screen.getByAltText("Right: Banner")).toHaveAttribute(
      "src",
      "/media/banners/portal.png",
    );
  });

  it("defaults both panes to the only asset when just one exists", async () => {
    const user = userEvent.setup();

    render(
      <ArtworkComparisonDialog
        entry={makeEntry({ cover_path: "covers/portal.png" })}
      />,
    );

    await user.click(screen.getByRole("button", { name: /compare artwork/i }));

    expect(await screen.findByAltText("Left: Cover")).toBeInTheDocument();
    expect(screen.getByAltText("Right: Cover")).toBeInTheDocument();
  });

  it("offers every artwork asset in both selectors", async () => {
    const user = userEvent.setup();

    render(
      <ArtworkComparisonDialog entry={entryWithArt} screenshots={screenshots} />,
    );

    await user.click(screen.getByRole("button", { name: /compare artwork/i }));
    await screen.findByRole("dialog");

    expect(screen.getByLabelText("Left")).toBeInTheDocument();
    expect(screen.getByLabelText("Right")).toBeInTheDocument();
  });
});
