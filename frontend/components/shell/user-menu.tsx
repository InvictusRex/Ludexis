"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Castle, LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { canSeeDashboard } from "@/lib/permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="grid size-9 place-items-center rounded-full bg-violet font-display text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-night hover:ring-2 hover:ring-violet-lit/60 focus-visible:ring-2 focus-visible:ring-violet-lit"
      >
        {user.username.slice(0, 1).toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-semibold text-parchment">{user.username}</p>
          <p className="truncate text-xs text-ash" data-mask>
            {user.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound /> Account
          </Link>
        </DropdownMenuItem>
        {canSeeDashboard(user) && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Castle /> Admin Dashboard
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await logout();
            router.replace("/auth/login");
          }}
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
