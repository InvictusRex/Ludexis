import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
  clearTokens,
  onTokensCleared,
} from "./token-store";

describe("token-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null for both tokens when nothing is stored", () => {
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("stores both tokens via setTokens and getters return them", () => {
    setTokens("access-123", "refresh-456");
    expect(getAccessToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-456");
  });

  it("setAccessToken(null) removes only the access token, refresh remains", () => {
    setTokens("access-123", "refresh-456");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBe("refresh-456");
  });

  it("setTokens(null, null) removes both tokens", () => {
    setTokens("access-123", "refresh-456");
    setTokens(null, null);
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("clearTokens removes both tokens", () => {
    setTokens("access-123", "refresh-456");
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it("notifies listeners on clearTokens and unsubscribe stops future notifications", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = onTokensCleared(first);
    const unsubscribeSecond = onTokensCleared(second);

    clearTokens();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();

    clearTokens();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);

    unsubscribeSecond();
  });

  it("no-ops when window is undefined (SSR guard)", () => {
    vi.stubGlobal("window", undefined);

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(() => setAccessToken("access-123")).not.toThrow();
    expect(() => setTokens("access-123", "refresh-456")).not.toThrow();
    expect(() => clearTokens()).not.toThrow();
  });
});
