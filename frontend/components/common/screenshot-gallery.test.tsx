import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScreenshotGallery } from "./screenshot-gallery";
import { artworkApi } from "@/lib/api";
import type { Screenshot } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  artworkApi: { upload: vi.fn(), remove: vi.fn() },
}));

vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));

const shot = (id: string, caption: string | null = null): Screenshot => ({
  id,
  archive_entry_id: "entry-1",
  file_path: `entry-1/screenshot/${id}.png`,
  caption,
  created_at: "2026-01-01T00:00:00Z",
});

describe("ScreenshotGallery", () => {
  afterEach(cleanup);

  it("says when there are no screenshots", () => {
    render(<ScreenshotGallery entryId="entry-1" title="Meadow" screenshots={[]} onChanged={vi.fn()} />);

    expect(screen.getByText("No screenshots yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add screenshot" })).not.toBeInTheDocument();
  });

  it("opens a lightbox that steps with the arrow keys and closes on Escape", async () => {
    render(
      <ScreenshotGallery
        entryId="entry-1"
        title="Meadow"
        screenshots={[shot("a", "Title screen"), shot("b")]}
        onChanged={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Title screen" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("1 / 2");
    expect(screen.getAllByRole("img", { name: "Title screen" }).at(-1)).toHaveAttribute(
      "src",
      expect.stringContaining("entry-1/screenshot/a.png"),
    );

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(dialog).toHaveTextContent("2 / 2");
    expect(dialog).toHaveTextContent("Meadow, screenshot 2");

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(dialog).toHaveTextContent("1 / 2");

    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("lets editors upload and delete screenshots", async () => {
    vi.mocked(artworkApi.upload).mockResolvedValue({
      archive_entry_id: "entry-1",
      artwork_type: "screenshot",
      file_path: "x.png",
    });
    vi.mocked(artworkApi.remove).mockResolvedValue({ deleted: true });
    const onChanged = vi.fn();
    const user = userEvent.setup();
    render(<ScreenshotGallery entryId="entry-1" title="Meadow" screenshots={[shot("a")]} canEdit onChanged={onChanged} />);

    const file = new File(["data"], "shot.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Screenshot file"), file);
    expect(artworkApi.upload).toHaveBeenCalledWith({ archive_entry_id: "entry-1", artwork_type: "screenshot", file });

    await user.click(screen.getByRole("button", { name: "Delete Meadow, screenshot 1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(artworkApi.remove).toHaveBeenCalledWith("a", "screenshot");
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(2));
  });
});
