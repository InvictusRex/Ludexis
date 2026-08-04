import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { MetadataAuditTrail } from "./metadata-audit-trail";
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

const logs: AuditLogRead[] = [
  {
    id: "l1",
    action: "create",
    entity: "ArchiveEntry",
    entity_id: "entry-1",
    user_id: "u1",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "l2",
    action: "MANUAL_METADATA_OVERRIDE",
    entity: "ArchiveEntry",
    entity_id: "entry-1",
    user_id: "u2",
    details: "Title corrected",
    created_at: "2026-01-03T00:00:00Z",
  },
  {
    id: "l3",
    action: "update",
    entity: "ArchiveEntry",
    entity_id: "other-entry",
    user_id: "u1",
    created_at: "2026-01-04T00:00:00Z",
  },
];

describe("MetadataAuditTrail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("requests ArchiveEntry audit logs", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<MetadataAuditTrail entryId="entry-1" />);

    await screen.findByText("create");
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({
      entity: "ArchiveEntry",
      limit: 100,
    });
  });

  it("renders only the events belonging to this entry", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<MetadataAuditTrail entryId="entry-1" />);

    expect(await screen.findByText("create")).toBeInTheDocument();
    expect(screen.getByText("MANUAL_METADATA_OVERRIDE")).toBeInTheDocument();
    expect(screen.queryByText("update")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("orders events newest first with actor and details", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<MetadataAuditTrail entryId="entry-1" />);

    await screen.findByText("create");
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("MANUAL_METADATA_OVERRIDE");
    expect(items[0]).toHaveTextContent("by u2");
    expect(items[0]).toHaveTextContent("Title corrected");
    expect(items[1]).toHaveTextContent("create");
  });

  it("shows an empty state when the entry has no recorded changes", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<MetadataAuditTrail entryId="entry-1" />);

    expect(
      await screen.findByText("No metadata changes recorded"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when loading fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValue(new Error("network"));

    render(<MetadataAuditTrail entryId="entry-1" />);

    expect(
      await screen.findByText(
        "Failed to load metadata audit trail. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
