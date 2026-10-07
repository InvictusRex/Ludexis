import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { useAuth } from "@/contexts/auth-context";
import { EffectivePermissionsPanel } from "./effective-permissions-panel";
import type { User } from "@/lib/types";

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

const permission = (name: string, description?: string) => ({ id: name, name, description });

const mockUser = (overrides: Partial<User>) =>
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "u1", username: "alice", email: "alice@example.com", is_active: true, is_superuser: false, ...overrides },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });

const item = (label: string) => screen.getByText(label).closest("li");

describe("EffectivePermissionsPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("lists granted and missing permissions in plain language, grouped", () => {
    mockUser({
      roles: [
        { id: "r1", name: "Editor", permissions: [permission("VIEW_LIBRARY"), permission("EDIT_METADATA")] },
        { id: "r2", name: "Viewer", permissions: [permission("VIEW_LIBRARY")] },
      ],
    });

    render(<EffectivePermissionsPanel />);

    expect(screen.getByRole("heading", { name: "Library" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Admin Dashboard" })).toBeInTheDocument();
    expect(item("Browse the library")).toHaveTextContent("(allowed)");
    expect(item("Identify games and edit their details and artwork")).toHaveTextContent("(allowed)");
    expect(item("Manage users and roles")).toHaveTextContent("(not allowed)");
    expect(screen.queryByText("VIEW_LIBRARY")).not.toBeInTheDocument();
  });

  it("grants everything to a superuser", () => {
    mockUser({ is_superuser: true, roles: [] });

    render(<EffectivePermissionsPanel />);

    expect(screen.getByText("You are a superuser, so every permission is granted.")).toBeInTheDocument();
    expect(screen.queryByText(/\(not allowed\)/)).not.toBeInTheDocument();
  });

  it("shows permissions it has no label for under Other, by description", () => {
    mockUser({ roles: [{ id: "r1", name: "Custom", permissions: [permission("EXPORT_DATA", "Export data")] }] });

    render(<EffectivePermissionsPanel />);

    expect(screen.getByRole("heading", { name: "Other" })).toBeInTheDocument();
    expect(item("Export data")).toHaveTextContent("(allowed)");
  });
});
