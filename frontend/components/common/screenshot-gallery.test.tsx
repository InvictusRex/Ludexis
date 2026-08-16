import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreenshotGallery } from "./screenshot-gallery";
import { archiveApi, artworkApi } from "@/lib/api";
import type { Screenshot } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  archiveApi: {
    getScreenshots: vi.fn(),
  },
  artworkApi: {
    upload: vi.fn(),
    remove: vi.fn(),
  },
}));

const makeScreenshot = (overrides: Partial<Screenshot> = {}): Screenshot => ({
  id: "shot-1",
  archive_entry_id: "entry-1",
  file_path: "entry-1/screenshot/abc.png",
  caption: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("ScreenshotGallery", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the empty state when there are no screenshots", async () => {
    vi.mocked(archiveApi.getScreenshots).mockResolvedValue([]);

    render(<ScreenshotGallery entryId="entry-1" />);

    expect(await screen.findByText("No screenshots yet")).toBeInTheDocument();
  });

  it("renders an img per screenshot with the mediaUrl-resolved src", async () => {
    vi.mocked(archiveApi.getScreenshots).mockResolvedValue([
      makeScreenshot({ id: "shot-1", caption: "Menu" }),
      makeScreenshot({ id: "shot-2" }),
    ]);

    render(<ScreenshotGallery entryId="entry-1" />);

    const imgs = await screen.findAllByRole("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute(
      "src",
      "http://localhost:8000/media/entry-1/screenshot/abc.png",
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("calls artworkApi.remove with the screenshot id when delete is confirmed", async () => {
    vi.mocked(archiveApi.getScreenshots).mockResolvedValue([makeScreenshot()]);
    vi.mocked(artworkApi.remove).mockResolvedValue({ deleted: true });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();

    render(<ScreenshotGallery entryId="entry-1" />);
    await screen.findByRole("img");

    await user.click(screen.getByRole("button", { name: /delete screenshot/i }));

    expect(artworkApi.remove).toHaveBeenCalledWith("shot-1", "screenshot");
  });

  it("uploads a file via artworkApi.upload with artwork_type screenshot", async () => {
    vi.mocked(archiveApi.getScreenshots).mockResolvedValue([]);
    vi.mocked(artworkApi.upload).mockResolvedValue({
      archive_entry_id: "entry-1",
      artwork_type: "screenshot",
      file_path: "entry-1/screenshot/abc.png",
    });
    const user = userEvent.setup();

    render(<ScreenshotGallery entryId="entry-1" />);
    await screen.findByText("No screenshots yet");

    const file = new File(["data"], "shot.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Screenshot file"), file);

    expect(artworkApi.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        archive_entry_id: "entry-1",
        artwork_type: "screenshot",
        file,
      }),
    );
  });
});
