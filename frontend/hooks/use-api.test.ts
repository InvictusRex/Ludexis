import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useApi } from "./use-api";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("useApi", () => {
  it("keeps the newest response when an older one arrives late", async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const calls = { a: slow.promise, b: fast.promise } as Record<string, Promise<string>>;

    const { result, rerender } = renderHook(({ key }) => useApi(() => calls[key], [key]), {
      initialProps: { key: "a" },
    });
    rerender({ key: "b" });

    await act(async () => fast.resolve("b"));
    await act(async () => slow.resolve("a"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("b");
  });

  it("reports errors and reloads on demand", async () => {
    let fail = true;
    const { result } = renderHook(() =>
      useApi(() => (fail ? Promise.reject(new Error("down")) : Promise.resolve("up")), []),
    );
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

    fail = false;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.data).toBe("up"));
    expect(result.current.error).toBeUndefined();
  });
});
