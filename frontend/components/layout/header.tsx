"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Settings, LogOut, CircleUser } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { toastSuccess, toastError } from "@/lib/toast";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toastSuccess("Signed out");
      router.push("/auth/login");
    } catch (error) {
      toastError(error, "Failed to sign out");
    }
  };

  const displayName = user?.username ?? "Guest";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="hidden lg:flex fixed top-0 right-0 left-64 h-20 bg-card border-b border-border items-center justify-between px-8 z-30">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 min-w-0">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search archive..."
            aria-label="Search archive"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </form>

      {/* Auth Status + User Menu */}
      <div className="flex items-center gap-4">
        {authLoading ? (
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        ) : !user ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold">
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  Signed in as {displayName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <CircleUser size={18} />
                  Account
                </Link>
              </DropdownMenuItem>
              {user.is_superuser ? (
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <Settings size={18} />
                    My account
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <Settings size={18} />
                  {displayName}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
