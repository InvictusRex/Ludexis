"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Castle,
  Crown,
  GalleryVerticalEnd,
  Hammer,
  House,
  LibraryBig,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { canSeeDashboard } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/collections", label: "Collections", icon: GalleryVerticalEnd },
];

const BROWSE: NavItem[] = [
  { href: "/developers", label: "Developers", icon: Hammer },
  { href: "/publishers", label: "Publishers", icon: Building2 },
  { href: "/franchises", label: "Franchises", icon: Crown },
  { href: "/tags", label: "Tags", icon: Tag },
];

const DASHBOARD: NavItem = { href: "/admin", label: "Admin Dashboard", icon: Castle };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, compact, onNavigate }: { item: NavItem; compact: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={compact ? item.label : undefined}
      title={compact ? item.label : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium transition-colors",
        compact && "justify-center px-0",
        active ? "bg-stone text-parchment" : "text-ash hover:bg-stone/60 hover:text-parchment",
      )}
    >
      {active && (
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-spark" />
      )}
      <Icon className={cn("size-[18px] shrink-0", active && "text-violet-lit")} />
      {!compact && item.label}
    </Link>
  );
}

/** The navigation shared by the desktop sidebar and the mobile sheet. */
export function NavList({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {MAIN.map((item) => (
        <NavLink key={item.href} item={item} compact={compact} onNavigate={onNavigate} />
      ))}
      <p className={cn("mb-1 mt-5 px-3 text-xs font-medium text-ash/70", compact && "sr-only")}>Browse</p>
      {BROWSE.map((item) => (
        <NavLink key={item.href} item={item} compact={compact} onNavigate={onNavigate} />
      ))}
      {canSeeDashboard(user) && (
        <>
          <div className="mx-3 my-4 border-t border-seam" />
          <NavLink item={DASHBOARD} compact={compact} onNavigate={onNavigate} />
        </>
      )}
    </nav>
  );
}
