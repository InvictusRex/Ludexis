"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useRequireAuth(accessToken: string | null, loading: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && accessToken === null) {
      router.push("/auth/login");
    }
  }, [accessToken, loading, router]);
}
