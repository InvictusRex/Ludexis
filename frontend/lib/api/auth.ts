import { apiClient } from "./client";

import type {
  LoginRequest,
  TokenResponse,
} from "@/lib/types/auth";

import type { User } from "@/lib/types/user";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/login", credentials, false);
  },

  // Both use the refresh cookie; the response renews or clears the session cookies.
  refresh: async (): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/refresh", undefined, false);
  },

  logout: async (): Promise<void> => {
    return apiClient.post<void>("/auth/logout", undefined, false);
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },
};
