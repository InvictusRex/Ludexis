import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArtworkManagementDialog } from "./artwork-management-dialog";
import { archiveApi, artworkApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  archiveApi: {
    getById: vi.fn(),
  },
  artworkApi: {
    upload: vi.fn(),
    replace: vi.fn(),
    remove: vi.fn(),
  },
}));

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "entry-1",
  title: "Game One",
  file_path: "/path/one",
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

describe("ArtworkManagementDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the entry's artwork types", async () => {
    const entry = makeEntry({
      cover_path: "entry-1/cover/x.png",
      banner_path: "entry-1/banner/y.png",
    });
    vi.mocked(archiveApi.getById).mockResolvedValue(entry);

    render(
      <ArtworkManagementDialog
        entry={entry}
        open
        onOpenChange={vi.fn()}
      />,
    );

    const cover = screen.getByRole("img", { name: "Cover preview" });
    expect(cover).toHaveAttribute(
      "src",
      "http://localhost:8000/media/entry-1/cover/x.png",
    );
    expect(
      screen.getByRole("img", { name: "Banner preview" }),
    ).toHaveAttribute(
      "src",
      "http://localhost:8000/media/entry-1/banner/y.png",
    );
    expect(
      screen.getByRole("button", { name: /upload logo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upload screenshot/i }),
    ).toBeInTheDocument();
  });

  it("uploads a file for a missing artwork type via artworkApi.upload", async () => {
    const entry = makeEntry();
    vi.mocked(archiveApi.getById).mockResolvedValue(entry);
    vi.mocked(artworkApi.upload).mockResolvedValue({
      archive_entry_id: "entry-1",
      artwork_type: "cover",
      file_path: "entry-1/cover/new.png",
    });
    const user = userEvent.setup();

    render(
      <ArtworkManagementDialog
        entry={entry}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /upload cover/i }));

    const file = new File(["data"], "cover.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Cover file"), file);

    expect(artworkApi.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        archive_entry_id: "entry-1",
        artwork_type: "cover",
        file,
      }),
    );
  });

  it("deletes present artwork via artworkApi.remove", async () => {
    const entry = makeEntry({ cover_path: "entry-1/cover/x.png" });
    vi.mocked(archiveApi.getById).mockResolvedValue(entry);
    vi.mocked(artworkApi.remove).mockResolvedValue({ deleted: true });
    const user = userEvent.setup();

    render(
      <ArtworkManagementDialog
        entry={entry}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /delete cover/i }),
    );

    expect(artworkApi.remove).toHaveBeenCalledWith("entry-1", "cover");
  });

  it("calls onOpenChange with false when the dialog is closed", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ArtworkManagementDialog
        entry={makeEntry()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
