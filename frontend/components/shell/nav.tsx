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
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useReviewCount } from "@/hooks/use-review-count";
import { can, canSeeDashboard } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/library", label: "Library", icon: LibraryBig },
  { href: "/favourites", label: "Favourites", icon: Star },
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

function NavLink({
  item,
  compact,
  onNavigate,
  alert,
}: {
  item: NavItem;
  compact: boolean;
  onNavigate?: () => void;
  /** Shown as a red dot, e.g. "3 games to review". */
  alert?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={compact ? [item.label, alert].filter(Boolean).join(", ") : undefined}
      title={compact ? [item.label, alert].filter(Boolean).join(" · ") : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-medium transition-colors",
        compact && "justify-center px-0",
        active ? "bg-stone text-parchment" : "text-ash hover:bg-stone/60 hover:text-parchment",
      )}
    >
      {active && (
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-spark" />
      )}
      <span className="relative shrink-0">
        <Icon className={cn("size-[18px]", active && "text-violet-lit")} />
        {alert && <AlertDot label={compact ? undefined : alert} className="absolute -right-1 -top-1" />}
      </span>
      {!compact && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/** A red dot for something an administrator should look at; label is read by screen readers. */
export function AlertDot({ label, className }: { label?: string; className?: string }) {
  return (
    <span className={cn("relative flex size-2 shrink-0", className)}>
      <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-ember/70 motion-reduce:hidden" />
      <span aria-hidden="true" className="relative size-2 rounded-full bg-ember" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export const reviewAlert = (count: number) =>
  count > 0 ? `${count} ${count === 1 ? "game" : "games"} to review` : undefined;

/** The navigation shared by the desktop sidebar and the mobile sheet. */
export function NavList({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { user } = useAuth();
  const toReview = useReviewCount(canSeeDashboard(user) && can(user, "EDIT_METADATA"));

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
          <NavLink item={DASHBOARD} compact={compact} onNavigate={onNavigate} alert={reviewAlert(toReview)} />
        </>
      )}
    </nav>
  );
}
