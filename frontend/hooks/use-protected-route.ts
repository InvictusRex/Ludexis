"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

export function useRequireAuth(user: User | null, loading: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && user === null) {
      router.push("/auth/login");
    }
  }, [loading, router, user]);
}

export function useRequireAdmin(user: User | null, loading: boolean) {
  useRequireAuth(user, loading);

  const router = useRouter();

  useEffect(() => {
    if (!loading && user !== null && !user.is_superuser) {
      router.push("/");
    }
  }, [loading, router, user]);
}
