"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BootScreen } from "@/components/brand/boot-screen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const COLLAPSED_KEY = "ludexis.sidebarCollapsed";

/** Signed-in chrome. Pages inside it can assume a user is present. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // Storage can be unavailable (private windows); the sidebar just starts expanded.
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <BootScreen />;
  }

  const toggle = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });
  };

  return (
    <div className="min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-(--sidebar-w-collapsed)" : "lg:pl-(--sidebar-w)",
        )}
      >
        <Topbar onSearch={() => setSearching(true)} />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {/* Keyed by route so a page error clears when the user navigates away. */}
          <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
        </main>
      </div>
      <CommandPalette open={searching} onOpenChange={setSearching} />
    </div>
  );
}
