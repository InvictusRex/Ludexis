"use client";

import { usePathname } from "next/navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col lg:mt-20">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 min-w-0 w-full px-4 lg:px-8 overflow-auto mt-16 lg:mt-0 outline-none"
        >
          {/* Keyed by route so a page error clears when the user navigates away. */}
          <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
