import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { adminApi, usersApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { UserAnalyticsDashboard } from "./user-analytics-dashboard";
import type { AuditLogRead, User } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  adminApi: {
    getAuditLogs: vi.fn(),
  },
  usersApi: {
    getAll: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const makeLog = (
  id: string,
  action: string,
  userId: string | null,
  createdAt: string,
): AuditLogRead => ({
  id,
  action,
  entity: "ArchiveEntry",
  user_id: userId,
  created_at: createdAt,
});

const makeUser = (id: string, username: string, isActive = true): User => ({
  id,
  username,
  email: `${username}@example.com`,
  is_active: isActive,
  is_superuser: false,
});

const users = [
  makeUser("u1", "alice"),
  makeUser("u2", "bob"),
  makeUser("u3", "carol", false),
];

const logs = [
  makeLog("l1", "LOGIN_SUCCESS", "u1", "2026-01-01T10:00:00Z"),
  makeLog("l2", "create", "u1", "2026-01-01T11:00:00Z"),
  makeLog("l3", "update", "u1", "2026-01-01T12:00:00Z"),
  makeLog("l4", "delete", "u2", "2026-01-01T09:00:00Z"),
  makeLog("l5", "RUN_FULL_SCAN", null, "2026-01-01T08:00:00Z"),
];

describe("UserAnalyticsDashboard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("ranks the most active users by audit event count", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(usersApi.getAll).mockResolvedValue(users);

    render(<UserAnalyticsDashboard />);

    expect(await screen.findByText("#1 alice · 3")).toBeInTheDocument();
    expect(screen.getByText("#2 bob · 1")).toBeInTheDocument();
    expect(screen.getByText("#3 system · 1")).toBeInTheDocument();
  });

  it("groups audit actions into a distribution with percentages", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(usersApi.getAll).mockResolvedValue(users);

    render(<UserAnalyticsDashboard />);

    expect(await screen.findByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Scans")).toBeInTheDocument();
    expect(screen.getAllByText("1 · 20%")).toHaveLength(5);
  });

  it("summarizes user counts by active state", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(usersApi.getAll).mockResolvedValue(users);

    render(<UserAnalyticsDashboard />);

    const tileValue = async (label: string) => {
      const tile = (await screen.findByText(label)).closest("div");
      return tile?.querySelector("p:last-of-type")?.textContent;
    };

    expect(await tileValue("Recorded Events")).toBe("5");
    expect(await tileValue("Total Users")).toBe("3");
    expect(await tileValue("Active Users")).toBe("2");
    expect(await tileValue("Inactive Users")).toBe("1");
  });

  it("shows each user's total actions and most recent activity", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(usersApi.getAll).mockResolvedValue(users);

    render(<UserAnalyticsDashboard />);

    const aliceRow = (await screen.findByRole("cell", { name: "alice" }))
      .closest("tr");
    expect(aliceRow).not.toBeNull();
    expect(aliceRow).toHaveTextContent("3");
    expect(aliceRow).toHaveTextContent(
      new Date("2026-01-01T12:00:00Z").toLocaleString(),
    );
  });

  it("shows an empty state when no audit events exist", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([]);
    vi.mocked(usersApi.getAll).mockResolvedValue(users);

    render(<UserAnalyticsDashboard />);

    expect(
      await screen.findByText("No user activity recorded"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when loading fails", async () => {
    vi.mocked(adminApi.getAuditLogs).mockRejectedValue(new Error("network"));
    vi.mocked(usersApi.getAll).mockRejectedValue(new Error("network"));

    render(<UserAnalyticsDashboard />);

    expect(
      await screen.findByText("Failed to load user analytics. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
