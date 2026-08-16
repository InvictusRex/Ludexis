import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { AccountActivityList } from "./account-activity-list";
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
    action: "LOGIN_SUCCESS",
    entity: "User",
    user_id: "u1",
    created_at: "2026-01-02T10:00:00Z",
  },
  {
    id: "l2",
    action: "update",
    entity: "ArchiveEntry",
    user_id: "u1",
    details: "Renamed entry",
    created_at: "2026-01-01T10:00:00Z",
  },
];

describe("AccountActivityList", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("requests audit logs scoped to the given user", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<AccountActivityList userId="u1" />);

    await screen.findByText("LOGIN_SUCCESS");
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({
      user_id: "u1",
      limit: 50,
    });
  });

  it("renders a row per activity entry with action, entity, and details", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);

    render(<AccountActivityList userId="u1" />);

    expect(await screen.findByText("LOGIN_SUCCESS")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("update")).toBeInTheDocument();
    expect(screen.getByText("ArchiveEntry")).toBeInTheDocument();
    expect(screen.getByText("Renamed entry")).toBeInTheDocument();
    expect(
      screen.getByText(new Date("2026-01-02T10:00:00Z").toLocaleString()),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the user has no recorded activity", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);

    render(<AccountActivityList userId="u1" />);

    expect(
      await screen.findByText("No recent account activity"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button and toasts on error", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValue(new Error("network"));

    render(<AccountActivityList userId="u1" />);

    expect(
      await screen.findByText(
        "Failed to load account activity. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
