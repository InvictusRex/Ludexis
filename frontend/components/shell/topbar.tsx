"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";
import { canSeeDashboard } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { JobsIndicator } from "./jobs-indicator";
import { NavList } from "./nav";
import { UserMenu } from "./user-menu";

/** Transparent over artwork at the top of a page, frosted once the page scrolls under it. */
export function Topbar({ onSearch }: { onSearch: () => void }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-(--topbar-h) items-center gap-3 px-(--gutter) transition-[background-color,border-color] duration-200",
        scrolled ? "border-b border-seam/70 bg-night/80 backdrop-blur-md" : "border-b border-transparent",
      )}
    >
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger
          aria-label="Open navigation"
          className="-ml-2 grid size-9 place-items-center rounded-full text-parchment hover:bg-stone lg:hidden"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="px-3 py-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link href="/" onClick={() => setMenuOpen(false)} className="mb-4 px-3" aria-label="Ludexis home">
            <Wordmark />
          </Link>
          <NavList onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <Link href="/" aria-label="Ludexis home" className="lg:hidden">
        <Wordmark compact />
      </Link>

      <button
        type="button"
        onClick={onSearch}
        className="ml-auto flex h-10 items-center gap-3 rounded-full border border-seam bg-night/60 px-4 text-sm text-ash backdrop-blur transition-colors hover:border-violet-lit/50 hover:text-parchment sm:w-[min(26rem,40vw)] lg:ml-0"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Search your archive</span>
        <kbd className="hidden rounded border border-seam px-1.5 text-xs sm:inline">Ctrl K</kbd>
        <span className="sr-only sm:hidden">Search</span>
      </button>

      <div className="flex items-center gap-1.5 lg:ml-auto">
        {canSeeDashboard(user) && <JobsIndicator />}
        <UserMenu />
      </div>
    </header>
  );
}
