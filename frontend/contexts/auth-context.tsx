"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { authApi } from "@/lib/api/auth";
import type { User, TokenResponse } from "@/lib/types";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  login: (username: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  accessToken: string | null;
  refreshToken: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_TOKEN_KEY = "ludexis_access_token";
const REFRESH_TOKEN_KEY = "ludexis_refresh_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedAccessToken || !storedRefreshToken) {
        setLoading(false);
        return;
      }

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);

      const currentUser = await authApi.getCurrentUser(storedAccessToken);

      setUser(currentUser);
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);

      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const tokens: TokenResponse = await authApi.login({
      username,
      password,
    });

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);

    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);

    const currentUser = await authApi.getCurrentUser(tokens.access_token);

    setUser(currentUser);
  }

  async function logout() {
    if (refreshToken) {
      try {
        await authApi.logout({
          refresh_token: refreshToken,
        });
      } catch {
        // Ignore logout failures
      }
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);

    localStorage.removeItem(REFRESH_TOKEN_KEY);

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        accessToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
