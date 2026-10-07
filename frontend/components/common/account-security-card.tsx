"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
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
  const canSave = current.length > 0 && next.length >= MIN_PASSWORD_LENGTH && next === confirm;

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
      toastError(error, "Could not change your password");
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
      toastError(error, "Could not sign out everywhere");
      setSigningOut(false);
    }
  };

  return (
    <section aria-labelledby="security-heading" className="rounded-lg border border-seam bg-vault p-5">
      <h2 id="security-heading" className="text-lg font-semibold text-parchment">
        Security
      </h2>

      <form onSubmit={handleChange} className="mt-4 space-y-4">
        <h3 className="text-sm font-medium text-ash">Change password</h3>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
            <p id="new-password-hint" className="text-xs text-ash">
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={mismatch}
              aria-describedby={mismatch ? "confirm-password-error" : undefined}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
            {mismatch && (
              <p id="confirm-password-error" className="text-xs text-ember">
                Passwords do not match
              </p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={!canSave || saving}>
          {saving && <Loader2 className="animate-spin" />}
          Change password
        </Button>
      </form>

      <div className="mt-6 space-y-3 border-t border-seam pt-5">
        <h3 className="text-sm font-medium text-ash">Sessions</h3>
        <p className="text-sm text-ash">
          Lost a device or signed in somewhere you shouldn&apos;t have? Sign out of every session, including this one.
        </p>
        <Button variant="outline" onClick={handleLogoutAll} disabled={signingOut}>
          {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          Log out everywhere
        </Button>
      </div>
    </section>
  );
}
