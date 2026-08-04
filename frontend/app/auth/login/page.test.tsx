import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import LoginPage from "./page";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

const mockAuth = (login: (username: string, password: string) => Promise<void>) => {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    login,
    logout: vi.fn(),
  });
};

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders username and password inputs and the sign-in button", () => {
    mockAuth(vi.fn());

    render(<LoginPage />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("calls login with the typed credentials and redirects to / on success", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth(login);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(login).toHaveBeenCalledWith("admin", "secret");
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error message when login rejects", async () => {
    const login = vi
      .fn()
      .mockRejectedValue(new Error("Invalid credentials"));
    mockAuth(login);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      await screen.findByText("Invalid credentials"),
    ).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
