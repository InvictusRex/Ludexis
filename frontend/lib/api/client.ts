import { config } from "@/lib/config";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorBody = await response.json();

      if (errorBody.detail) {
        errorMessage = errorBody.detail;
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
  get: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, {
      method: "GET",
      token,
    }),

  post: <T>(endpoint: string, body?: unknown, token?: string) =>
    request<T>(endpoint, {
      method: "POST",
      body,
      token,
    }),

  patch: <T>(endpoint: string, body?: unknown, token?: string) =>
    request<T>(endpoint, {
      method: "PATCH",
      body,
      token,
    }),

  put: <T>(endpoint: string, body?: unknown, token?: string) =>
    request<T>(endpoint, {
      method: "PUT",
      body,
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, {
      method: "DELETE",
      token,
    }),
};
