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

const mockAuth = (login = vi.fn()) =>
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, login, logout: vi.fn() });

describe("SetupPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("redirects to login when the server is already set up", async () => {
    mockAuth();
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: true });

    render(<SetupPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/auth/login"));
  });

  it("rejects mismatched passwords on the first step", async () => {
    mockAuth();
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: false });
    const user = userEvent.setup();

    render(<SetupPage />);

    expect(screen.getByRole("heading", { name: "Create the first administrator account" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), "secret2");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(screen.getByRole("heading", { name: "Create the first administrator account" })).toBeInTheDocument();
  });

  it("creates the administrator, signs in, adds the library and starts a scan", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth(login);
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: false });
    vi.mocked(setupApi.initialize).mockResolvedValue({});
    vi.mocked(librariesApi.create).mockResolvedValue({} as never);
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), "secret1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Add your games folder" })).toBeInTheDocument();
    expect(screen.getByLabelText("Games folder")).toHaveValue("/games");
    await user.type(screen.getByLabelText("IGDB client ID (optional)"), "client-1");
    await user.type(screen.getByLabelText("IGDB client secret (optional)"), "secret-1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("admin (admin@example.com)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finish setup" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(setupApi.initialize).toHaveBeenCalledWith({
      username: "admin",
      email: "admin@example.com",
      password: "secret1",
    });
    expect(login).toHaveBeenCalledWith("admin", "secret1");
    expect(librariesApi.create).toHaveBeenCalledWith({ name: "Main Library", path: "/games" });
    expect(systemApi.updateSettings).toHaveBeenCalledWith({ igdb_client_id: "client-1", igdb_client_secret: "secret-1" });
    expect(scansApi.runFull).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Setup complete" })).toBeInTheDocument();
  });
});
