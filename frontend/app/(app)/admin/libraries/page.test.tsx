import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { librariesApi, scansApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import DashboardLibraries from "./page";
import type { LibraryRead, User } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/libraries",
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  librariesApi: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  scansApi: { runFull: vi.fn(), runIncremental: vi.fn() },
}));

const library: LibraryRead = { id: "lib-1", name: "Iron Tide Drive", path: "/games/iron", enabled: true, status: "ONLINE" };
const admin: User = { id: "admin-1", username: "admin", email: "a@example.com", is_active: true, is_superuser: true };

describe("DashboardLibraries", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("scans a single library for changes", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: admin, loading: false, login: vi.fn(), logout: vi.fn() } as any);
    vi.mocked(librariesApi.getAll).mockResolvedValue([library]);
    vi.mocked(scansApi.runIncremental).mockResolvedValue({});
    render(<DashboardLibraries />);

    fireEvent.click(await screen.findByRole("button", { name: "Scan Iron Tide Drive for changes" }));

    await waitFor(() => expect(scansApi.runIncremental).toHaveBeenCalledWith("lib-1"));
  });
});
