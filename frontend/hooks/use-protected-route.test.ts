import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import type { User } from "@/lib/types";
import { useRequirePermission } from "./use-protected-route";

const mockRouter = { replace: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

function Harness({ user, loading }: { user: User | null; loading: boolean }) {
  useRequirePermission(user, loading, "ACCESS_ADMIN");
  return null;
}

const base = { id: "u1", username: "alex", email: "a@example.com", is_active: true, is_superuser: false };
const withPermission = (name: string): User => ({
  ...base,
  roles: [{ id: "r1", name: "Role", permissions: [{ id: "p1", name }] }],
} as User);

describe("useRequirePermission", () => {
  afterEach(() => {
    cleanup();
    mockRouter.replace.mockClear();
  });

  it("waits while the session loads and leaves signed-out users to the shell", () => {
    render(createElement(Harness, { user: null, loading: true }));
    render(createElement(Harness, { user: null, loading: false }));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("sends a user without the permission home", () => {
    render(createElement(Harness, { user: withPermission("VIEW_LIBRARY"), loading: false }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("lets users with the permission and superusers stay", () => {
    render(createElement(Harness, { user: withPermission("ACCESS_ADMIN"), loading: false }));
    render(createElement(Harness, { user: { ...base, is_superuser: true }, loading: false }));
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
