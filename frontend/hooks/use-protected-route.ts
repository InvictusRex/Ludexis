"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { can, type Permission } from "@/lib/permissions";

// Sends users without `permission` back home; the Dashboard sections use this.
export function useRequirePermission(
  user: User | null,
  loading: boolean,
  permission: Permission,
) {
  const router = useRouter();

  useEffect(() => {
    if (!loading && user !== null && !can(user, permission)) {
      router.replace("/");
    }
  }, [loading, permission, router, user]);
}
