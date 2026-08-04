import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MetadataHistoryCard } from "./metadata-history-card";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { AuditLogRead } from "@/lib/types";

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

const makeLog = (overrides: Partial<AuditLogRead> = {}): AuditLogRead => ({
  id: "log-1",
  user_id: "user-1",
  action: "metadata.update",
  entity: "ArchiveEntry",
  entity_id: "entry-1",
  details: null,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("MetadataHistoryCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders audit log rows with action and user for the entry", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([
      makeLog({ id: "log-1", action: "metadata.update", user_id: "user-1" }),
      makeLog({
        id: "log-2",
        action: "metadata.match",
        user_id: null,
        created_at: "2026-01-02T00:00:00Z",
      }),
    ]);

    render(<MetadataHistoryCard entryId="entry-1" />);

    expect(await screen.findByText("metadata.update")).toBeInTheDocument();
    expect(screen.getByText("user-1")).toBeInTheDocument();
    expect(screen.getByText("metadata.match")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("filters out audit logs belonging to other entries", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([
      makeLog({ id: "log-1", action: "metadata.update" }),
      makeLog({
        id: "log-2",
        action: "other.update",
        entity_id: "entry-2",
      }),
    ]);

    render(<MetadataHistoryCard entryId="entry-1" />);

    expect(await screen.findByText("metadata.update")).toBeInTheDocument();
    expect(screen.queryByText("other.update")).not.toBeInTheDocument();
  });

  it("renders the empty state when there is no history", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<MetadataHistoryCard entryId="entry-1" />);

    expect(
      await screen.findByText("No metadata history yet"),
    ).toBeInTheDocument();
  });

  it("shows an error toast when fetching fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValue(new Error("boom"));

    render(<MetadataHistoryCard entryId="entry-1" />);

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
