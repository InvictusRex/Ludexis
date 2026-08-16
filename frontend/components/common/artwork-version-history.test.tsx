import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { ArtworkVersionHistory } from "./artwork-version-history";
import type { ArchiveEntry, AuditLogRead, Screenshot } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  adminApi: {
    getAuditLogs: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
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
  updated_at: "2026-01-05T00:00:00Z",
  ...overrides,
});

const entryWithArt = makeEntry({
  cover_path: "covers/portal.png",
  logo_path: "logos/portal.png",
});

const screenshots: Screenshot[] = [
  {
    id: "s1",
    archive_entry_id: "entry-1",
    file_path: "screenshots/one.png",
    caption: "Test chamber",
    created_at: "2026-02-01T00:00:00Z",
  },
];

const logs: AuditLogRead[] = [
  {
    id: "l1",
    action: "update",
    entity: "ArchiveEntry",
    entity_id: "entry-1",
    user_id: "u1",
    created_at: "2026-01-10T00:00:00Z",
  },
  {
    id: "l2",
    action: "update",
    entity: "ArchiveEntry",
    entity_id: "other-entry",
    user_id: "u1",
    created_at: "2026-03-01T00:00:00Z",
  },
];

describe("ArtworkVersionHistory", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists every artwork asset on record", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(
      <ArtworkVersionHistory entry={entryWithArt} screenshots={screenshots} />,
    );

    expect(await screen.findByText("Cover")).toBeInTheDocument();
    expect(screen.getByText("Logo")).toBeInTheDocument();
    expect(screen.getByText("Test chamber")).toBeInTheDocument();
    expect(screen.getByText("covers/portal.png")).toBeInTheDocument();
  });

  it("derives asset timestamps from audit logs scoped to this entry", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<ArtworkVersionHistory entry={entryWithArt} />);

    const coverRow = (await screen.findByText("Cover")).closest("tr");
    expect(coverRow).toHaveTextContent(
      new Date("2026-01-10T00:00:00Z").toLocaleString(),
    );
    expect(coverRow).not.toHaveTextContent(
      new Date("2026-03-01T00:00:00Z").toLocaleString(),
    );
  });

  it("falls back to the entry's updated_at when no audit log matches", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<ArtworkVersionHistory entry={entryWithArt} />);

    const coverRow = (await screen.findByText("Cover")).closest("tr");
    expect(coverRow).toHaveTextContent(
      new Date("2026-01-05T00:00:00Z").toLocaleString(),
    );
  });

  it("orders the newest asset first", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(
      <ArtworkVersionHistory entry={entryWithArt} screenshots={screenshots} />,
    );

    await screen.findByText("Cover");
    const labels = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent);
    expect(labels[0]).toBe("Test chamber");
  });

  it("shows an empty state when the entry has no artwork", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<ArtworkVersionHistory entry={makeEntry()} />);

    expect(await screen.findByText("No artwork on record")).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when loading fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValue(new Error("network"));

    render(<ArtworkVersionHistory entry={entryWithArt} />);

    expect(
      await screen.findByText(
        "Failed to load artwork history. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
