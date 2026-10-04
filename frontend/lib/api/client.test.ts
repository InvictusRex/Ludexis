import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api/client";
import { config } from "@/lib/config";
import * as session from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({
  endSession: vi.fn(),
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("1. GET sends the session cookie and the CSRF header to the base URL", async () => {
    const body = { id: 1, name: "Ludexis" };
    fetchMock.mockResolvedValue(jsonResponse(200, body));

    const result = await apiClient.get<typeof body>("/users");

    expect(result).toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${config.apiBaseUrl}/users`);
    expect(init.method).toBe("GET");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers["X-Requested-With"]).toBe("ludexis");
    expect(init.credentials).toBe("include");
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("2. auth=false does not try to refresh on 401", async () => {
    fetchMock.mockResolvedValue(unauthorized);

    await expect(apiClient.post("/auth/login", {}, false)).rejects.toThrow("HTTP 401");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("2b. FormData is sent as-is with no JSON content type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    const form = new FormData();
    form.set("artwork_type", "cover");

    await apiClient.post("/artwork/upload", form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.headers["X-Requested-With"]).toBe("ludexis");
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

  it("8. 401 refreshes through the cookie and retries once", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(jsonResponse(200, { token_type: "bearer" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 42 }));

    const result = await apiClient.get<{ id: number }>("/users");

    expect(result).toEqual({ id: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [refreshCallUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(refreshCallUrl).toBe(refreshUrl);
    expect(refreshInit.method).toBe("POST");
    expect(refreshInit.body).toBeUndefined();
    expect(refreshInit.credentials).toBe("include");
    expect(refreshInit.headers["X-Requested-With"]).toBe("ludexis");
  });

  it("9. 401 with failed refresh ends the session and does not retry", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(
        jsonResponse(401, { detail: "Invalid refresh token" }),
      );

    await expect(apiClient.get("/users")).rejects.toThrow("HTTP 401");
    expect(session.endSession).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("10. a network failure during refresh ends the session", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(apiClient.get("/users")).rejects.toThrow("HTTP 401");
    expect(session.endSession).toHaveBeenCalled();
  });

  it("11. concurrent 401s trigger a single refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(jsonResponse(200, { token_type: "bearer" }))
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
  });

  it("12. refreshPromise is reset after a completed refresh", async () => {
    fetchMock
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(jsonResponse(200, { token_type: "bearer" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }))
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(jsonResponse(200, { token_type: "bearer" }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 2 }));

    const first = await apiClient.get<{ id: number }>("/users");
    const second = await apiClient.get<{ id: number }>("/users");

    expect(first).toEqual({ id: 1 });
    expect(second).toEqual({ id: 2 });
    const refreshCalls = fetchMock.mock.calls.filter(
      (call) => call[0] === refreshUrl,
    );
    expect(refreshCalls).toHaveLength(2);
  });

  it("13. GET retries transient failures and then succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { id: 1 }));

    await expect(apiClient.get("/users")).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("14. POST is not retried on a transient failure", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, { detail: "unavailable" }));

    await expect(apiClient.post("/jobs/start", {})).rejects.toThrow("unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
