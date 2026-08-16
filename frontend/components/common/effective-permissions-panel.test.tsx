import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { EffectivePermissionsPanel } from "./effective-permissions-panel";
import type { PermissionReport, User } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  adminApi: {
    getPermissionReport: vi.fn(),
  },
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  is_active: true,
  is_superuser: false,
  ...overrides,
});

const makeRoles = (names: string[]) => names.map((name) => ({ name }));

const mockAuth = (user: User | null, loading = false) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

const report: PermissionReport = {
  Editor: ["view.collections", "edit.metadata"],
  Reviewer: ["view.collections", "review.submissions"],
};

describe("EffectivePermissionsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders role badges for the current user", async () => {
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue(report);
    mockAuth({ ...makeUser(), roles: makeRoles(["Editor", "Reviewer"]) } as User);

    render(<EffectivePermissionsPanel />);

    expect(await screen.findByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });

  it("renders the effective permission codes from the user's roles", async () => {
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue(report);
    mockAuth({ ...makeUser(), roles: makeRoles(["Editor", "Reviewer"]) } as User);

    render(<EffectivePermissionsPanel />);

    expect(await screen.findByText("view.collections")).toBeInTheDocument();
    expect(screen.getByText("edit.metadata")).toBeInTheDocument();
    expect(screen.getByText("review.submissions")).toBeInTheDocument();
  });

  it("shows the all permissions badge for a superuser", async () => {
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue(report);
    mockAuth({
      ...makeUser({ is_superuser: true }),
      roles: makeRoles(["Admin"]),
    } as User);

    render(<EffectivePermissionsPanel />);

    expect(
      await screen.findByText("All permissions (superuser)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows a failure message when the permission report fails to load", async () => {
    vi.mocked(adminApi.getPermissionReport).mockRejectedValue(
      new Error("network"),
    );
    mockAuth({ ...makeUser(), roles: makeRoles(["Editor"]) } as User);

    render(<EffectivePermissionsPanel />);

    expect(
      await screen.findByText(
        "Failed to load effective permissions. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
