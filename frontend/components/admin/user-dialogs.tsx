"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api";
import type { RoleRead, User } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function RoleChecklist({
  roles,
  selected,
  onChange,
  idPrefix,
}: {
  roles: RoleRead[];
  selected: string[];
  onChange: (ids: string[]) => void;
  idPrefix: string;
}) {
  if (roles.length === 0) {
    return <p className="text-sm text-ash">No roles exist yet. Create one under Roles &amp; permissions.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {roles.map((role) => (
        <li key={role.id} className="flex items-start gap-3">
          <Checkbox
            id={`${idPrefix}-${role.id}`}
            checked={selected.includes(role.id)}
            onCheckedChange={(checked) =>
              onChange(checked === true ? [...selected, role.id] : selected.filter((id) => id !== role.id))
            }
          />
          <Label htmlFor={`${idPrefix}-${role.id}`} className="block font-normal">
            <span className="text-parchment">{role.name}</span>
            {role.description && <span className="block text-xs text-ash">{role.description}</span>}
          </Label>
        </li>
      ))}
    </ul>
  );
}

export function CreateUserDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleRead[];
  onCreated: () => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [superuser, setSuperuser] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername("");
      setEmail("");
      setPassword("");
      setSuperuser(false);
      setRoleIds([]);
    }
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await usersApi.create({
        username: username.trim(),
        email: email.trim(),
        password,
        is_superuser: superuser,
        role_ids: roleIds,
      });
      toastSuccess(`${username.trim()} can now sign in`);
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toastError(error, "Could not create the user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Roles decide what they can change; anyone signed in can browse the library.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input id="new-username" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium text-parchment">Roles</legend>
            <RoleChecklist roles={roles} selected={roleIds} onChange={setRoleIds} idPrefix="new-role" />
          </fieldset>
          <div className="flex items-start gap-3 border-t border-seam pt-4">
            <Checkbox id="new-superuser" checked={superuser} onCheckedChange={(checked) => setSuperuser(checked === true)} />
            <Label htmlFor="new-superuser" className="block font-normal">
              <span className="text-parchment">Superuser</span>
              <span className="block text-xs text-ash">Can do everything, whatever their roles say.</span>
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !username.trim() || !email.trim() || !password}>
              Add user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UserRolesDialog({
  user,
  roles,
  onOpenChange,
  onSaved,
}: {
  user: User | null;
  roles: RoleRead[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRoleIds(user?.roles?.map((role) => role.id) ?? []);
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersApi.update(user.id, { role_ids: roleIds });
      toastSuccess("Roles saved");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toastError(error, "Could not save the roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Roles for {user?.username}</DialogTitle>
          <DialogDescription>
            {user?.is_superuser ? "This user is a superuser, so roles do not limit them." : "Pick what this user can do."}
          </DialogDescription>
        </DialogHeader>
        <RoleChecklist roles={roles} selected={roleIds} onChange={setRoleIds} idPrefix="edit-role" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            Save roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResetPasswordDialog({ user, onOpenChange }: { user: User | null; onOpenChange: (open: boolean) => void }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPassword("");
  }, [user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await usersApi.resetPassword(user.id, password);
      toastSuccess(`Password changed for ${user.username}`);
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Could not change the password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Reset password for {user?.username}</DialogTitle>
            <DialogDescription>Tell them the new password; they can change it from their account page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !password}>
              Set password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
