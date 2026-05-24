"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col lg:mt-20">
        <Header />
        <main className="flex-1 min-w-0 w-full px-4 lg:px-8 overflow-auto mt-16 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
