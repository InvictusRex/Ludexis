"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toastError } from "@/lib/toast";
import type { PermissionReport, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthedUser extends User {
  roles?: Array<{ name: string }>;
}

export function EffectivePermissionsPanel() {
  const { user, loading } = useAuth();
  const [report, setReport] = useState<PermissionReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const loadReport = useCallback(async () => {
    setLoadingReport(true);
    setError(null);
    try {
      const result = await adminApi.getPermissionReport();
      setReport(result);
    } catch (err) {
      toastError(err, "Failed to load effective permissions.");
      setError("Failed to load effective permissions. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !user) {
      return;
    }
    loadReport();
  }, [loading, user, loadReport]);

  if (loading || !user) {
    return null;
  }

  const roleNames = (user as AuthedUser).roles?.map((role) => role.name) ?? [];
  const effectiveCodes = user.is_superuser
    ? []
    : Array.from(
        new Set(roleNames.flatMap((name) => report?.[name] ?? [])),
      ).sort();

  const filteredCodes = effectiveCodes.filter((code) =>
    code.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Effective Permissions</CardTitle>
        <CardDescription>
          The permissions you can exercise based on your assigned roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Roles</Label>
          {roleNames.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {roleNames.map((name) => (
                <Badge key={name} variant="secondary" className="border-border">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {user.is_superuser ? (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <Badge className="bg-accent text-accent-foreground">
              All permissions (superuser)
            </Badge>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Effective Permissions</Label>
            {loadingReport ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : error ? (
              <div className="space-y-2">
                <p className="text-sm text-red-600">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border"
                  onClick={loadReport}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <Input
                  aria-label="Filter permissions"
                  placeholder="Filter permissions..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filteredCodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {filter.trim()
                      ? "No permissions match your filter."
                      : "No permissions found."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredCodes.map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="border-border"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
