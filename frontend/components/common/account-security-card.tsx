"use client";

import { useState } from "react";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toastError, toastSuccess } from "@/lib/toast";
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

const MIN_PASSWORD_LENGTH = 8;

export function AccountSecurityCard() {
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSave =
    current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && next === confirm;

  const handleChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toastSuccess("Password changed. Your other sessions were signed out.");
    } catch (error) {
      toastError(error, "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    setSigningOut(true);
    try {
      await authApi.logoutAll();
      await logout();
    } catch (error) {
      toastError(error, "Failed to sign out everywhere");
      setSigningOut(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="w-5 h-5" />
          Security
        </CardTitle>
        <CardDescription>
          Change your password or sign out of every device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleChange} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              aria-invalid={mismatch}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {mismatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={!canSave || saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Change password
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Lost a device or signed in somewhere you shouldn&apos;t have? Sign
            out of every session, including this one.
          </p>
          <Button
            variant="destructive"
            onClick={handleLogoutAll}
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Log out everywhere
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
