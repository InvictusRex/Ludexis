import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import AccountPage from "./page";
import type { User } from "@/lib/types";

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  adminApi: { getAuditLogs: vi.fn() },
  authApi: { changePassword: vi.fn(), logoutAll: vi.fn() },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const permission = (name: string) => ({ id: name, name });

const mockUser = (overrides: Partial<User> = {}) =>
  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: "u1",
      username: "alice",
      email: "alice@example.com",
      is_active: true,
      is_superuser: false,
      roles: [{ id: "r1", name: "Editor", permissions: [permission("VIEW_LIBRARY")] }],
      ...overrides,
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });

describe("AccountPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows the profile, security and permissions sections", () => {
    mockUser();

    render(<AccountPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toHaveAttribute("data-mask");
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Security" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Permissions" })).toBeInTheDocument();
  });

  it("hides recent activity from users who cannot read the activity log", () => {
    mockUser();

    render(<AccountPage />);

    expect(screen.queryByRole("heading", { name: "Recent activity" })).not.toBeInTheDocument();
    expect(adminApi.getAuditLogs).not.toHaveBeenCalled();
  });

  it("marks a superuser and loads their recent activity", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue([
      { id: "l1", action: "LOGIN_SUCCESS", entity: "User", user_id: "u1", created_at: "2026-01-02T10:00:00Z" },
    ]);
    mockUser({ is_superuser: true });

    render(<AccountPage />);

    expect(screen.getByText("Superuser")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent activity" })).toBeInTheDocument();
    expect(await screen.findByText("Signed in")).toBeInTheDocument();
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({ user_id: "u1", limit: 100 });
  });
});
