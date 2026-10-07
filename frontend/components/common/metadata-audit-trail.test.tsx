import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { MetadataAuditTrail } from "./metadata-audit-trail";
import type { AuditLogRead } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  adminApi: { getAuditLogs: vi.fn() },
}));

const logs: AuditLogRead[] = [
  { id: "l1", action: "create", entity: "ArchiveEntry", entity_id: "entry-1", user_id: null, created_at: "2026-01-01T00:00:00Z" },
  {
    id: "l2",
    action: "MANUAL_METADATA_OVERRIDE",
    entity: "ArchiveEntry",
    entity_id: "entry-1",
    user_id: "u2",
    details: "Title corrected",
    created_at: "2026-01-03T00:00:00Z",
  },
  { id: "l3", action: "update", entity: "ArchiveEntry", entity_id: "other", user_id: "u1", created_at: "2026-01-04T00:00:00Z" },
];

describe("MetadataAuditTrail", () => {
  afterEach(cleanup);

  it("lists this game's events newest first, in words", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<MetadataAuditTrail entryId="entry-1" currentUserId="u2" />);

    expect(await screen.findByText("Metadata set by hand")).toBeInTheDocument();
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({ entity: "ArchiveEntry", limit: 100 });
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Title corrected");
    expect(items[0]).toHaveTextContent("by you");
    expect(items[1]).toHaveTextContent("Added to the library");
    expect(items[1]).toHaveTextContent("by the system");
    expect(screen.queryByText("Details edited")).not.toBeInTheDocument();
  });

  it("says when nothing is recorded", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<MetadataAuditTrail entryId="entry-1" />);

    expect(await screen.findByText("No changes recorded for this game yet.")).toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValueOnce(new Error("network")).mockResolvedValue([]);

    render(<MetadataAuditTrail entryId="entry-1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Retry" }));

    await waitFor(() => expect(adminApi.getAuditLogs).toHaveBeenCalledTimes(2));
  });
});
