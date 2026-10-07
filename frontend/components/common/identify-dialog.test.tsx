import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { archiveApi, metadataApi } from "@/lib/api";
import { toastSuccess } from "@/lib/toast";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";
import { IdentifyDialog } from "./identify-dialog";
import type { ArchiveEntry } from "@/lib/types";

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/components/shell/jobs-indicator", () => ({ announceJobsChanged: vi.fn() }));

vi.mock("@/lib/api", () => ({
  metadataApi: { searchProvider: vi.fn() },
  archiveApi: { identify: vi.fn() },
}));

const entry = { id: "entry-1", title: "quiet meadow v0.4" } as ArchiveEntry;

describe("IdentifyDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("searches with the game title and applies the chosen result", async () => {
    vi.mocked(metadataApi.searchProvider).mockResolvedValue([
      { provider: "VNDB", provider_id: "v42", title: "Quiet Meadow", release_date: "2021-05-04", cover_url: "https://example.test/c.jpg" },
      { provider: "IGDB", provider_id: "7", title: "Quiet Meadow 2" },
    ]);
    vi.mocked(archiveApi.identify).mockResolvedValue({
      entry: { ...entry, title: "Quiet Meadow" },
      updated_entries: 3,
      artwork_job: {} as never,
    });
    const onIdentified = vi.fn();
    const onOpenChange = vi.fn();
    render(<IdentifyDialog entry={entry} open onOpenChange={onOpenChange} onIdentified={onIdentified} />);

    expect(screen.getByLabelText("Title")).toHaveValue("quiet meadow v0.4");
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText("Quiet Meadow")).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(metadataApi.searchProvider).toHaveBeenCalledWith("quiet meadow v0.4", "all");

    fireEvent.click(screen.getByRole("button", { name: "Select Quiet Meadow from VNDB" }));

    await waitFor(() => expect(archiveApi.identify).toHaveBeenCalledWith("entry-1", "VNDB", "v42"));
    expect(onIdentified).toHaveBeenCalledWith(expect.objectContaining({ title: "Quiet Meadow" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(vi.mocked(toastSuccess).mock.calls[0][0]).toContain("and 2 other versions");
    expect(announceJobsChanged).toHaveBeenCalled();
  });

  it("says so when nothing is found", async () => {
    vi.mocked(metadataApi.searchProvider).mockResolvedValue([]);
    render(<IdentifyDialog entry={entry} open onOpenChange={vi.fn()} onIdentified={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText(/no results/i)).toBeInTheDocument();
    expect(archiveApi.identify).not.toHaveBeenCalled();
  });
});
