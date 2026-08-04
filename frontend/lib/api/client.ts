import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "@/lib/auth/token-store";
import { config } from "@/lib/config";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "1";

function debugLog(
  method: string,
  url: string,
  status: number | string,
  durationMs: number,
): void {
  if (DEBUG) {
    console.info("[api]", method, url, status, durationMs);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return false;
  }

  try {
    const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    setTokens(data.access_token, data.refresh_token ?? refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  const startedAt = Date.now();

  const method = options.method ?? "GET";

  const url = `${config.apiBaseUrl}${endpoint}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    debugLog(method, url, "error", Date.now() - startedAt);
    throw error;
  }

  debugLog(method, url, response.status, Date.now() - startedAt);

  if (response.status === 401 && options.auth !== false && !retried) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return request<T>(endpoint, options, true);
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody.detail) {
        if (typeof errorBody.detail === "string") {
          errorMessage = errorBody.detail;
        } else if (Array.isArray(errorBody.detail)) {
          errorMessage = errorBody.detail
            .map((d: { msg?: string }) => d.msg ?? "")
            .filter(Boolean)
            .join("; ");
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, auth?: boolean) =>
    request<T>(endpoint, {
      method: "GET",
      auth,
    }),

  post: <T>(endpoint: string, body?: unknown, auth?: boolean) =>
    request<T>(endpoint, {
      method: "POST",
      body,
      auth,
    }),

  patch: <T>(endpoint: string, body?: unknown, auth?: boolean) =>
    request<T>(endpoint, {
      method: "PATCH",
      body,
      auth,
    }),

  put: <T>(endpoint: string, body?: unknown, auth?: boolean) =>
    request<T>(endpoint, {
      method: "PUT",
      body,
      auth,
    }),

  delete: <T>(endpoint: string, auth?: boolean) =>
    request<T>(endpoint, {
      method: "DELETE",
      auth,
    }),
};
