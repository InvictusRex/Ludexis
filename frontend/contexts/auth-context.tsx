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

import { endSession, onSessionEnded } from "@/lib/auth/session";
import { authApi } from "@/lib/api/auth";
import type { User } from "@/lib/types";

type AuthContextType = {
  user: User | null;
  loading: boolean;

  login: (username: string, password: string) => Promise<void>;

  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const userRef = useRef<User | null>(null);

  const loggingOutRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // The session cookie goes with every request; /auth/me says whether it is still valid
    // (the client renews an expired access cookie through the refresh cookie on its own).
    authApi
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    // Fired when a refresh fails: the refresh cookie expired or was revoked.
    return onSessionEnded(() => {
      if (userRef.current && !loggingOutRef.current) {
        toast.info("Session expired, please sign in again");
      }
      setUser(null);
    });
  }, []);

  async function login(username: string, password: string) {
    await authApi.login({ username, password });
    setUser(await authApi.getCurrentUser());
  }

  async function logout() {
    loggingOutRef.current = true;
    try {
      await authApi.logout();
    } catch {
      // The cookies are cleared locally below either way.
    } finally {
      endSession();
      loggingOutRef.current = false;
    }
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
