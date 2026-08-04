import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import AccountPage from "./page";
import type { AuditLogRead, User } from "@/lib/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  adminApi: {
    getAuditLogs: vi.fn(),
    getPermissionReport: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "u1",
  username: "alice",
  email: "alice@example.com",
  is_active: true,
  is_superuser: false,
  ...overrides,
});

const mockAuth = (user: User | null, loading = false) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

const logs: AuditLogRead[] = [
  {
    id: "l1",
    action: "LOGIN_SUCCESS",
    entity: "User",
    user_id: "u1",
    created_at: "2026-01-02T10:00:00Z",
  },
];

describe("AccountPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the signed-in user's profile details", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue({});
    mockAuth(makeUser());

    render(<AccountPage />);

    expect(
      await screen.findByRole("heading", { name: "My Account" }),
    ).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("marks a superuser account type", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue({});
    mockAuth(makeUser({ is_superuser: true }));

    render(<AccountPage />);

    expect(await screen.findByText("Superuser")).toBeInTheDocument();
  });

  it("renders the account activity section for the current user", async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue(logs);
    vi.mocked(adminApi.getPermissionReport).mockResolvedValue({});
    mockAuth(makeUser());

    render(<AccountPage />);

    expect(await screen.findByText("Account Activity")).toBeInTheDocument();
    expect(await screen.findByText("LOGIN_SUCCESS")).toBeInTheDocument();
    expect(adminApi.getAuditLogs).toHaveBeenCalledWith({
      user_id: "u1",
      limit: 50,
    });
  });

  it("redirects to login when there is no authenticated user", () => {
    mockAuth(null);

    render(<AccountPage />);

    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});
