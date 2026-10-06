import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authApi } from "@/lib/api";
import { toastSuccess } from "@/lib/toast";
import { AccountSecurityCard } from "./account-security-card";

const logout = vi.fn();

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ logout }),
}));

vi.mock("@/lib/api", () => ({
  authApi: { changePassword: vi.fn(), logoutAll: vi.fn() },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("AccountSecurityCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("changes the password once the new one is long enough and confirmed", async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue({ token_type: "bearer", expires_in: 900, refresh_expires_in: 1 });
    render(<AccountSecurityCard />);
    const submit = screen.getByRole("button", { name: /change password/i });

    type("Current password", "old-pass-1");
    type("New password", "short");
    type("Confirm new password", "short");
    expect(submit).toBeDisabled();

    type("New password", "new-pass-22");
    type("Confirm new password", "new-pass-2");
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    type("Confirm new password", "new-pass-22");
    fireEvent.click(submit);

    await waitFor(() => expect(authApi.changePassword).toHaveBeenCalledWith("old-pass-1", "new-pass-22"));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(screen.getByLabelText("Current password")).toHaveValue("");
  });

  it("logs out of every session and then this one", async () => {
    vi.mocked(authApi.logoutAll).mockResolvedValue(undefined);
    render(<AccountSecurityCard />);

    fireEvent.click(screen.getByRole("button", { name: /log out everywhere/i }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(authApi.logoutAll).toHaveBeenCalled();
  });
});
