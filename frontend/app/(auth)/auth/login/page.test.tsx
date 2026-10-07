import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/contexts/auth-context";
import { setupApi } from "@/lib/api/setup";
import type { User } from "@/lib/types";
import LoginPage from "./page";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/setup", () => ({
  setupApi: { getStatus: vi.fn() },
}));

const mockAuth = (login = vi.fn(), user: User | null = null) => {
  vi.mocked(useAuth).mockReturnValue({ user, loading: false, login, logout: vi.fn() });
};

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: true });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the brand, both fields and the sign-in button", () => {
    mockAuth();

    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Ludexis" })).toBeInTheDocument();
    expect(screen.getByText("Catalog · Enrich · Preserve")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("signs in with the typed credentials and goes home", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth(login);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(login).toHaveBeenCalledWith("admin", "secret");
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/"));
  });

  it("shows the server's error inline when sign-in fails", async () => {
    mockAuth(vi.fn().mockRejectedValue(new Error("Invalid username or password")));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
    expect(mockReplace).not.toHaveBeenCalledWith("/");
  });

  it("toggles password visibility", async () => {
    mockAuth();
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("sends a fresh server to setup", async () => {
    vi.mocked(setupApi.getStatus).mockResolvedValue({ initialized: false });
    mockAuth();

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/auth/setup"));
  });

  it("sends a signed-in user home", () => {
    mockAuth(vi.fn(), { id: "u1", username: "alice", email: "a@b.c", is_active: true, is_superuser: false });

    render(<LoginPage />);

    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
