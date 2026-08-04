import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { metadataApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { MetadataComparison } from "./metadata-comparison";
import type {
  ArchiveEntry,
  MetadataDetails,
  MetadataSearchResult,
} from "@/lib/types";

vi.mock("@/lib/api", () => ({
  metadataApi: {
    search: vi.fn(),
    getDetails: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const entry: ArchiveEntry = {
  id: "entry-1",
  title: "Portal",
  description: "A puzzle game",
  release_date: "2007-10-10",
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
};

const results: MetadataSearchResult[] = [
  {
    provider: "igdb",
    provider_id: "1",
    title: "Portal",
    score: 0.99,
  },
  {
    provider: "steam",
    provider_id: "400",
    title: "Portal (2007)",
    score: 0.8,
  },
];

const details: MetadataDetails = {
  provider: "igdb",
  provider_id: "1",
  title: "Portal",
  description: "A first-person puzzle game",
  release_date: "2007-10-10",
  genres: ["Puzzle"],
  developers: ["Valve"],
  publishers: ["Valve"],
  tags: [],
  cover_urls: [],
  banner_urls: [],
  logo_urls: [],
  artwork_urls: [],
};

describe("MetadataComparison", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("searches providers using the entry title", async () => {
    vi.mocked(metadataApi.search).mockResolvedValue(results);
    vi.mocked(metadataApi.getDetails).mockResolvedValue(details);

    render(<MetadataComparison entry={entry} />);

    await waitFor(() => expect(metadataApi.search).toHaveBeenCalledWith("Portal"));
    await waitFor(() =>
      expect(metadataApi.getDetails).toHaveBeenCalledWith("igdb", "1"),
    );
  });

  it("renders stored values beside the provider candidate", async () => {
    vi.mocked(metadataApi.search).mockResolvedValue(results);
    vi.mocked(metadataApi.getDetails).mockResolvedValue(details);

    render(
      <MetadataComparison
        entry={entry}
        storedDevelopers={["Valve"]}
        storedPublishers={["Sierra"]}
      />,
    );

    expect(await screen.findByText("A puzzle game")).toBeInTheDocument();
    expect(
      screen.getByText("A first-person puzzle game"),
    ).toBeInTheDocument();
    expect(screen.getByText("Stored")).toBeInTheDocument();
    expect(screen.getByText("Sierra")).toBeInTheDocument();
  });

  it("flags only the fields that differ", async () => {
    vi.mocked(metadataApi.search).mockResolvedValue(results);
    vi.mocked(metadataApi.getDetails).mockResolvedValue(details);

    render(
      <MetadataComparison
        entry={entry}
        storedDevelopers={["Valve"]}
        storedPublishers={["Sierra"]}
      />,
    );

    expect(await screen.findByText("2 fields differ")).toBeInTheDocument();

    const rowFor = (field: string) =>
      screen.getByText(field).closest("[data-differs]");

    expect(rowFor("Description")).toHaveAttribute("data-differs", "true");
    expect(rowFor("Publishers")).toHaveAttribute("data-differs", "true");
    expect(rowFor("Title")).toHaveAttribute("data-differs", "false");
    expect(rowFor("Developers")).toHaveAttribute("data-differs", "false");
    expect(rowFor("Release Date")).toHaveAttribute("data-differs", "false");
  });

  it("reports when the candidate matches stored metadata exactly", async () => {
    vi.mocked(metadataApi.search).mockResolvedValue(results);
    vi.mocked(metadataApi.getDetails).mockResolvedValue({
      ...details,
      description: "A puzzle game",
      developers: ["Valve"],
      publishers: ["Valve"],
    });

    render(
      <MetadataComparison
        entry={entry}
        storedDevelopers={["Valve"]}
        storedPublishers={["Valve"]}
      />,
    );

    expect(await screen.findByText("No differences")).toBeInTheDocument();
  });

  it("shows an empty state when no provider returns a candidate", async () => {
    vi.mocked(metadataApi.search).mockResolvedValue([]);

    render(<MetadataComparison entry={entry} />);

    expect(
      await screen.findByText("No provider candidates found"),
    ).toBeInTheDocument();
    expect(metadataApi.getDetails).not.toHaveBeenCalled();
  });

  it("shows a failure state with a Retry button when the search fails", async () => {
    vi.mocked(metadataApi.search).mockRejectedValue(new Error("network"));

    render(<MetadataComparison entry={entry} />);

    expect(
      await screen.findByText(
        "Failed to load provider candidates. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
