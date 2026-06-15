"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout failures and still redirect
    } finally {
      router.push("/auth/login");
    }
  };

  const displayName = user?.username ?? "Guest";
  const displayEmail = user?.email ?? "Not signed in";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="hidden lg:flex fixed top-0 right-0 left-64 h-20 bg-card border-b border-border items-center justify-between px-8 z-30">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 min-w-0">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search archive..."
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

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">{displayEmail}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
          {avatarLetter}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
