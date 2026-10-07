"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import { NavList } from "./nav";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-seam bg-vault transition-[width] duration-200 lg:flex",
        collapsed ? "w-(--sidebar-w-collapsed)" : "w-(--sidebar-w)",
      )}
    >
      <Link
        href="/"
        aria-label="Ludexis home"
        className={cn("flex h-(--topbar-h) shrink-0 items-center", collapsed ? "justify-center" : "px-5")}
      >
        <Wordmark compact={collapsed} />
      </Link>
      <div className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2.5" : "px-3")}>
        <NavList compact={collapsed} />
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "m-3 grid size-9 place-items-center rounded-lg text-ash hover:bg-stone hover:text-parchment",
          collapsed ? "self-center" : "self-end",
        )}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </button>
    </aside>
  );
}
