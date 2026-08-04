"use client";

import { Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { AccountActivityList } from "@/components/common/account-activity-list";
import { EffectivePermissionsPanel } from "@/components/common/effective-permissions-panel";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const { user, loading } = useAuth();

  useRequireAuth(user, loading);

  if (loading || !user) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">My Account</h1>
        <p className="text-muted-foreground">
          Your profile, permissions, and recent account activity
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Details for your signed-in account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Username
              </p>
              <p className="font-semibold text-foreground">{user.username}</p>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </p>
              <p className="font-semibold text-foreground">{user.email}</p>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Account Type
              </p>
              {user.is_superuser ? (
                <Badge className="bg-accent/15 text-accent border-accent/30">
                  Superuser
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-muted text-muted-foreground border-border"
                >
                  Standard
                </Badge>
              )}
            </div>
            <div className="rounded-lg border border-border p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              {user.is_active ? (
                <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EffectivePermissionsPanel />

      <AccountActivityList userId={user.id} />
    </div>
  );
}
