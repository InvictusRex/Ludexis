import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/api/auth";
import { librariesApi } from "@/lib/api/libraries";
import { scansApi } from "@/lib/api/scans";
import { systemApi } from "@/lib/api/system";
import { usersApi } from "@/lib/api/users";
import type { User } from "@/lib/types";
import SetupPage from "./page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/auth", () => ({
  authApi: { changePassword: vi.fn().mockResolvedValue({}) },
}));

vi.mock("@/lib/api/users", () => ({
  usersApi: { update: vi.fn().mockResolvedValue({}) },
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

const defaultAdmin: User = {
  id: "u1",
  username: "admin",
  email: "admin@example.com",
  is_active: true,
  is_superuser: true,
  must_change_password: true,
};

const mockAuth = (user: User | null = defaultAdmin, refreshUser = vi.fn().mockResolvedValue(undefined)) =>
  vi.mocked(useAuth).mockReturnValue({ user, loading: false, login: vi.fn(), logout: vi.fn(), refreshUser });

describe("SetupPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("sends a signed-out visitor to sign in", async () => {
    mockAuth(null);

    render(<SetupPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/auth/login"));
  });

  it("sends an account that already chose its password home", async () => {
    mockAuth({ ...defaultAdmin, must_change_password: false });

    render(<SetupPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("rejects mismatched passwords on the first step", async () => {
    mockAuth();
    const user = userEvent.setup();

    render(<SetupPage />);

    expect(screen.getByRole("heading", { name: "Secure the administrator account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveValue("admin");
    await user.type(screen.getByLabelText("New password"), "secret-one");
    await user.type(screen.getByLabelText("Confirm password"), "secret-two");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
    expect(screen.getByRole("heading", { name: "Secure the administrator account" })).toBeInTheDocument();
  });

  it("replaces the default password, renames the account, adds the library and starts a scan", async () => {
    const refreshUser = vi.fn().mockResolvedValue(undefined);
    mockAuth(defaultAdmin, refreshUser);
    vi.mocked(librariesApi.create).mockResolvedValue({} as never);
    const user = userEvent.setup();

    render(<SetupPage />);

    await user.clear(screen.getByLabelText("Username"));
    await user.type(screen.getByLabelText("Username"), "alex");
    await user.type(screen.getByLabelText("New password"), "secret-one");
    await user.type(screen.getByLabelText("Confirm password"), "secret-one");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("heading", { name: "Add your games folder" })).toBeInTheDocument();
    expect(screen.getByLabelText("Games folder")).toHaveValue("/games");
    await user.type(screen.getByLabelText("IGDB client ID (optional)"), "client-1");
    await user.type(screen.getByLabelText("IGDB client secret (optional)"), "secret-1");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("alex (admin@example.com)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finish setup" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    expect(authApi.changePassword).toHaveBeenCalledWith("", "secret-one");
    expect(usersApi.update).toHaveBeenCalledWith("u1", { username: "alex", email: "admin@example.com" });
    expect(librariesApi.create).toHaveBeenCalledWith({ name: "Main Library", path: "/games" });
    expect(systemApi.updateSettings).toHaveBeenCalledWith({ igdb_client_id: "client-1", igdb_client_secret: "secret-1" });
    expect(scansApi.runFull).toHaveBeenCalled();
    expect(refreshUser).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Setup complete" })).toBeInTheDocument();
  });
});
