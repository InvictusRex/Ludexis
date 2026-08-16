import { apiClient } from "./client";

import type {
  LoginRequest,
  LogoutRequest,
  RefreshRequest,
  TokenResponse,
} from "@/lib/types/auth";

import type { User } from "@/lib/types/user";

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/login", credentials, false);
  },

  refresh: async (request: RefreshRequest): Promise<TokenResponse> => {
    return apiClient.post<TokenResponse>("/auth/refresh", request, false);
  },

  logout: async (request: LogoutRequest): Promise<void> => {
    return apiClient.post<void>("/auth/logout", request, false);
  },

  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },
};
