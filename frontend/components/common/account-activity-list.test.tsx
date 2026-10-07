import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { adminApi } from "@/lib/api";
import { AccountActivityList, activityLabel } from "./account-activity-list";
import type { AuditLogRead } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  adminApi: {
    getAuditLogs: vi.fn(),
  },
}));

const log = (id: string, action: string, entity = "User", details?: string): AuditLogRead => ({
  id,
  action,
  entity,
  user_id: "u1",
  details,
  created_at: "2026-01-02T10:00:00Z",
});

describe("activityLabel", () => {
  it("reads audit actions as plain language", () => {
    expect(activityLabel(log("1", "LOGIN_SUCCESS"))).toBe("Signed in");
    expect(activityLabel(log("2", "update", "ArchiveEntry"))).toBe("Updated game");
    expect(activityLabel(log("3", "create", "Collection"))).toBe("Created collection");
    expect(activityLabel(log("4", "UPDATE_SCHEDULED_TASK"))).toBe("Update scheduled task");
  });
});

describe("AccountActivityList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists the user's activity without background token refreshes", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([
      log("1", "LOGIN_SUCCESS", "User", "User 'alice' logged in"),
      log("2", "TOKEN_REFRESH"),
      log("3", "update", "ArchiveEntry", "Renamed entry"),
    ]);

    render(<AccountActivityList userId="u1" />);

    expect(await screen.findByText("Signed in")).toBeInTheDocument();
    expect(screen.getByText("User 'alice' logged in")).toBeInTheDocument();
    expect(screen.getByText("Updated game")).toBeInTheDocument();
    expect(screen.queryByText("Token refresh")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({ user_id: "u1", limit: 100 });
  });

  it("says so when there is no activity yet", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<AccountActivityList userId="u1" />);

    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValueOnce(new Error("network")).mockResolvedValue([log("1", "LOGOUT")]);
    const user = userEvent.setup();

    render(<AccountActivityList userId="u1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your recent activity.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
  });
});
