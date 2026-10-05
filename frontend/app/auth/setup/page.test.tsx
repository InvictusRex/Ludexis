import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/contexts/auth-context";
import { librariesApi } from "@/lib/api/libraries";
import { setupApi } from "@/lib/api/setup";
import { scansApi } from "@/lib/api/scans";
import { systemApi } from "@/lib/api/system";
import SetupPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/setup", () => ({
  setupApi: { getStatus: vi.fn(), initialize: vi.fn() },
}));

vi.mock("@/lib/api/libraries", () => ({
  librariesApi: { create: vi.fn() },
}));

vi.mock("@/lib/api/scans", () => ({
  scansApi: { runFull: vi.fn().mockResolvedValue({}) },
}));

vi.mock("@/lib/api/system", () => ({
  systemApi: { updateSettings: vi.fn().mockResolvedValue({}) },
}));

describe("SetupPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("redirects to login when the system is already initialized", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() });
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: true });

    render(<SetupPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("initializes the admin, signs in, and creates the library", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login, logout: vi.fn() });
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: false });
    vi.mocked(setupApi.initialize).mockResolvedValue({});
    vi.mocked(librariesApi.create).mockResolvedValue({} as never);
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.type(screen.getByLabelText("Admin Username"), "admin");
    await user.type(screen.getByLabelText("Admin Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm Password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByLabelText("Primary Archive Location")).toHaveValue("/games");
    await user.type(screen.getByLabelText("IGDB client ID (optional)"), "client-1");
    await user.type(screen.getByLabelText("IGDB client secret (optional)"), "secret-1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(screen.getByRole("button", { name: "Complete Setup" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
    expect(setupApi.initialize).toHaveBeenCalledWith({
      username: "admin",
      email: "admin@example.com",
      password: "secret1",
    });
    expect(login).toHaveBeenCalledWith("admin", "secret1");
    expect(librariesApi.create).toHaveBeenCalledWith({ name: "Main Library", path: "/games" });
    expect(systemApi.updateSettings).toHaveBeenCalledWith({ igdb_client_id: "client-1", igdb_client_secret: "secret-1" });
    expect(scansApi.runFull).toHaveBeenCalled();
  });
});
