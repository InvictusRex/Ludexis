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

  // Signs out every other session; this one gets fresh cookies.
  changePassword: async (currentPassword: string, newPassword: string): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  logoutAll: async (): Promise<void> => {
    return apiClient.post<void>("/auth/logout-all");
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },
};
