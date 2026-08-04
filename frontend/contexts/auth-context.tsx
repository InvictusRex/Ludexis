"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import { toast } from "sonner";

import { onTokensCleared, setAccessToken } from "@/lib/auth/token-store";
import {
  getTokenExpiry,
  isExpired,
  msUntilExpiry,
} from "@/lib/auth/token-expiry";
import { authApi } from "@/lib/api/auth";
import type { User, TokenResponse } from "@/lib/types";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  login: (username: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_TOKEN_KEY = "ludexis_access_token";
const REFRESH_TOKEN_KEY = "ludexis_refresh_token";

const SESSION_CHECK_INTERVAL_MS = 30_000;

const SESSION_WARNING_WINDOW_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const accessExpiryRef = useRef<number | null>(null);

  const refreshExpiryRef = useRef<number | null>(null);

  const warningShownRef = useRef(false);

  const logoutRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    initializeAuth();

    const unsubscribe = onTokensCleared(() => {
      setUser(null);
      setRefreshToken(null);
      accessExpiryRef.current = null;
      refreshExpiryRef.current = null;
      warningShownRef.current = false;
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    logoutRef.current = logout;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!user) return;

      const now = Date.now();

      const accessExpiry = accessExpiryRef.current;
      const refreshExpiry = refreshExpiryRef.current;

      if (
        accessExpiry !== null &&
        refreshExpiry !== null &&
        isExpired(accessExpiry, now) &&
        isExpired(refreshExpiry, now)
      ) {
        toast.info("Session expired, please sign in again");
        logoutRef.current();
        return;
      }

      if (
        accessExpiry !== null &&
        !warningShownRef.current &&
        now < accessExpiry &&
        msUntilExpiry(accessExpiry, now) <= SESSION_WARNING_WINDOW_MS
      ) {
        const minutes = Math.max(
          1,
          Math.ceil(msUntilExpiry(accessExpiry, now) / 60_000),
        );

        toast.warning(
          `Session expires in ${minutes} minute${minutes === 1 ? "" : "s"}`,
        );

        warningShownRef.current = true;
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user]);

  async function initializeAuth() {
    try {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedAccessToken || !storedRefreshToken) {
        setAccessToken(null);
        setLoading(false);
        return;
      }

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      accessExpiryRef.current = getTokenExpiry(storedAccessToken);
      refreshExpiryRef.current = getTokenExpiry(storedRefreshToken);
      warningShownRef.current = false;

      const currentUser = await authApi.getCurrentUser();

      setUser(currentUser);
    } catch {
      setAccessToken(null);

      localStorage.removeItem(ACCESS_TOKEN_KEY);

      localStorage.removeItem(REFRESH_TOKEN_KEY);

      accessExpiryRef.current = null;
      refreshExpiryRef.current = null;
      warningShownRef.current = false;
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
    accessExpiryRef.current = getTokenExpiry(tokens.access_token);
    refreshExpiryRef.current = getTokenExpiry(tokens.refresh_token);
    warningShownRef.current = false;

    const currentUser = await authApi.getCurrentUser();

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

    setAccessToken(null);

    setUser(null);
    setRefreshToken(null);
    accessExpiryRef.current = null;
    refreshExpiryRef.current = null;
    warningShownRef.current = false;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
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
