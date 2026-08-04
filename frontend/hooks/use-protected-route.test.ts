import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { useRequireAuth } from "./use-protected-route";

const mockRouter = { push: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

function Harness({ user, loading }: { user: unknown; loading: boolean }) {
  useRequireAuth(user as never, loading);
  return null;
}

describe("useRequireAuth", () => {
  afterEach(() => {
    cleanup();
    mockRouter.push.mockClear();
  });

  it("does not push while loading even when user is null", () => {
    render(createElement(Harness, { user: null, loading: true }));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("pushes to /auth/login when loading is false and user is null", () => {
    render(createElement(Harness, { user: null, loading: false }));
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/login");
  });

  it("does not push when a user is set", () => {
    render(createElement(Harness, { user: { id: "u1" }, loading: false }));
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("does not re-push on rerenders with the same values", () => {
    const { rerender } = render(createElement(Harness, { user: null, loading: false }));
    expect(mockRouter.push).toHaveBeenCalledTimes(1);

    act(() => {
      rerender(createElement(Harness, { user: null, loading: false }));
    });
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });
});
