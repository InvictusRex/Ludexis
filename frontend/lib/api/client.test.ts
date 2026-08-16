import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config";
import * as tokenStore from "@/lib/auth/token-store";

vi.mock("@/lib/auth/token-store", () => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

const refreshUrl = `${config.apiBaseUrl}/auth/refresh`;

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const unauthorized = jsonResponse(401, {});

let fetchMock: ReturnType<typeof vi.fn>;

describe("apiClient", () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(tokenStore.getAccessToken).mockReturnValue("access-token");
    vi.mocked(tokenStore.getRefreshToken).mockReturnValue("refresh-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("1. GET attaches Bearer header from access token and hits the base URL", async () => {
    const body = { id: 1, name: "Ludexis" };
    fetchMock.mockResolvedValue(jsonResponse(200, body));

    const result = await apiClient.get<typeof body>("/users");

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${config.apiBaseUrl}/users`);
    expect(init.method).toBe("GET");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer access-token");
  });

  it("2. auth=false omits the Authorization header", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiClient.get("/users", false);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("3. POST sends JSON.stringify(body) with correct method/headers", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiClient.post("/things", { name: "widget", count: 3 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${config.apiBaseUrl}/things`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "widget", count: 3 }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("4. FastAPI string detail becomes the error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { detail: "User not found" }));

    await expect(apiClient.get("/users")).rejects.toThrow("User not found");
  });

  it("5. FastAPI validation array detail is joined by '; '", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(422, {
        detail: [{ msg: "field required" }, { msg: "must be >= 1" }],
      }),
    );

    await expect(apiClient.get("/users")).rejects.toThrow(
      "field required; must be >= 1",
    );
  });

  it("6. Non-JSON error body falls back to HTTP <status>", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    await expect(apiClient.get("/users")).rejects.toThrow("HTTP 500");
  });

  it("7. 204 resolves to undefined", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    await expect(apiClient.delete("/things/1")).resolves.toBeUndefined();
  });

  it("8. 401 triggers refresh and retries once", async () => {
    vi.mocked(tokenStore.getRefreshToken).mockReturnValue("old-refresh");
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "new-access",
          refresh_token: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 42 }));

    const result = await apiClient.get<{ id: number }>("/users");

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [, refreshInit] = fetchMock.mock.calls[1];
    expect(fetchMock.mock.calls[1][0]).toBe(refreshUrl);
    expect(refreshInit.method).toBe("POST");
    expect(JSON.parse(refreshInit.body)).toEqual({
      refresh_token: "old-refresh",
    });
    expect(tokenStore.setTokens).toHaveBeenCalledWith(
      "new-access",
      "new-refresh",
    );

    const [, retryInit] = fetchMock.mock.calls[2];
    expect(retryInit.headers.Authorization).toBe("Bearer access-token");
  });

  it("9. 401 with failed refresh clears tokens and does not retry", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(401, { detail: "Invalid refresh token" }),
      );

    await expect(apiClient.get("/users")).rejects.toThrow("HTTP 401");
    expect(tokenStore.clearTokens).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("10. 401 with no refresh token clears tokens and rejects", async () => {
    vi.mocked(tokenStore.getRefreshToken).mockReturnValue(null);
    fetchMock.mockResolvedValue(unauthorized);

    await expect(apiClient.get("/users")).rejects.toThrow("HTTP 401");
    expect(tokenStore.clearTokens).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("11. concurrent 401s trigger a single refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "new-access",
          refresh_token: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

    const results = await Promise.all([
      apiClient.get<{ id: number }>("/users"),
      apiClient.get<{ id: number }>("/users"),
    ]);

    expect(results).toEqual([{ id: 1 }, { id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === refreshUrl,
    );
    expect(refreshCalls).toHaveLength(1);
    expect(tokenStore.setTokens).toHaveBeenCalledTimes(1);
  });

  it("12. refreshPromise is reset after a completed refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "new-access",
          refresh_token: "new-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: "newer-access",
          refresh_token: "newer-refresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 2 }));

    const first = await apiClient.get<{ id: number }>("/users");
    const second = await apiClient.get<{ id: number }>("/users");

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 2 });
    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === refreshUrl,
    );
    expect(refreshCalls).toHaveLength(2);
    expect(tokenStore.setTokens).toHaveBeenCalledTimes(2);
  });
});
