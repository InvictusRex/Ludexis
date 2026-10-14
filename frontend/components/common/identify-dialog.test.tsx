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
  metadataApi: { searchProvider: vi.fn(), providers: vi.fn(async () => ["IGDB", "Steam"]) },
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
    render(<IdentifyDialog entry={entry} open onOpenChange={onOpenChange} onIdentified={onIdentified} versionCount={3} />);

    expect(screen.getByLabelText("Title")).toHaveValue("quiet meadow v0.4");
    fireEvent.click(screen.getByRole("checkbox", { name: "Also apply to the other 2 versions of this game" }));
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText("Quiet Meadow")).toBeInTheDocument();
    expect(screen.getByText("2021")).toBeInTheDocument();
    expect(metadataApi.searchProvider).toHaveBeenCalledWith("quiet meadow v0.4", "all", "");

    fireEvent.click(screen.getByRole("button", { name: "Select Quiet Meadow from VNDB" }));

    await waitFor(() => expect(archiveApi.identify).toHaveBeenCalledWith("entry-1", "VNDB", "v42", true));
    expect(onIdentified).toHaveBeenCalledWith(expect.objectContaining({ title: "Quiet Meadow" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(vi.mocked(toastSuccess).mock.calls[0][0]).toContain("and 2 other versions");
    expect(announceJobsChanged).toHaveBeenCalled();
  });

  it("passes the optional developer and shows each result's developers", async () => {
    vi.mocked(metadataApi.searchProvider).mockResolvedValue([
      { provider: "IGDB", provider_id: "7", title: "Quiet Meadow", developers: ["Lantern Works"] },
    ]);
    render(<IdentifyDialog entry={entry} open onOpenChange={vi.fn()} onIdentified={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/developer/i), { target: { value: "Lantern" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText("Lantern Works")).toBeInTheDocument();
    expect(metadataApi.searchProvider).toHaveBeenCalledWith("quiet meadow v0.4", "all", "Lantern");
  });

  it("identifies only this file unless asked to apply the match to every version", async () => {
    vi.mocked(metadataApi.searchProvider).mockResolvedValue([{ provider: "IGDB", provider_id: "7", title: "Iron Tide" }]);
    vi.mocked(archiveApi.identify).mockResolvedValue({ entry, updated_entries: 1, artwork_job: {} as never });
    render(<IdentifyDialog entry={entry} open onOpenChange={vi.fn()} onIdentified={vi.fn()} versionCount={2} />);

    expect(screen.getByRole("checkbox", { name: "Also apply to the other version of this game" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Select Iron Tide from IGDB" }));

    await waitFor(() => expect(archiveApi.identify).toHaveBeenCalledWith("entry-1", "IGDB", "7", false));
  });

  it("offers no all-versions choice for a game with one version", () => {
    render(<IdentifyDialog entry={entry} open onOpenChange={vi.fn()} onIdentified={vi.fn()} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("says so when nothing is found", async () => {
    vi.mocked(metadataApi.searchProvider).mockResolvedValue([]);
    render(<IdentifyDialog entry={entry} open onOpenChange={vi.fn()} onIdentified={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByText(/no results/i)).toBeInTheDocument();
    expect(archiveApi.identify).not.toHaveBeenCalled();
  });
});
