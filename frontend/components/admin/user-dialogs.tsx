"use client";

import { useEffect, useState } from "react";
import { collectionsApi, usersApi } from "@/lib/api";
import type { RoleRead, User } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

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

/** Like Jellyfin's per-user library access: whether restricted games, and which collections' games, this user sees. */
export function UserAccessDialog({
  user,
  onOpenChange,
  onSaved,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const collections = useApi(() => (user ? collectionsApi.getAll(0, 500, undefined, true) : Promise.resolve([])), [user]);
  const [allowRestricted, setAllowRestricted] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAllowRestricted(user?.allow_restricted ?? false);
    setBlocked(user?.blocked_collection_ids ?? []);
  }, [user]);

  const all = collections.data ?? [];
  const allowedCount = all.filter((collection) => !blocked.includes(collection.id)).length;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await usersApi.update(user.id, { allow_restricted: allowRestricted, blocked_collection_ids: blocked });
      toastSuccess(`Access saved for ${user.username}`);
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toastError(error, "Could not save the access");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access for {user?.username}</DialogTitle>
          <DialogDescription>
            Hidden games disappear for this user everywhere: library, home, search, collections and browse pages.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-parchment">Allow restricted content</legend>
          <p className="text-xs text-ash">
            Games a metadata source rates 18+, or that an admin marked restricted. Without it, games this user adds are
            also never matched against restricted sources such as VNDB.
          </p>
          <div role="radiogroup" aria-label="Allow restricted content" className="inline-flex rounded-lg border border-seam p-0.5">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                role="radio"
                aria-checked={allowRestricted === value}
                onClick={() => setAllowRestricted(value)}
                className={cn(
                  "h-8 rounded-md px-4 text-sm font-medium transition-colors",
                  allowRestricted === value ? "bg-violet text-parchment" : "text-ash hover:text-parchment",
                )}
              >
                {value ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </fieldset>

        <div aria-hidden="true" className="border-t border-seam" />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-parchment">Collections</legend>
          <p className="text-xs text-ash">Games in an unchecked collection are hidden from this user. New collections start checked.</p>
          {collections.error ? (
            <p className="text-sm text-ash">Collections could not be loaded.</p>
          ) : !collections.data ? (
            <Skeleton className="h-24" />
          ) : all.length === 0 ? (
            <p className="text-sm text-ash">There are no collections yet.</p>
          ) : (
            <ul className="divide-y divide-seam rounded-lg border border-seam">
              <li className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  id="access-all"
                  checked={allowedCount === all.length ? true : allowedCount === 0 ? false : "indeterminate"}
                  onCheckedChange={(checked) => setBlocked(checked === true ? [] : all.map((collection) => collection.id))}
                />
                <Label htmlFor="access-all" className="flex-1 text-parchment">
                  All collections
                </Label>
              </li>
              {all.map((collection) => (
                <li key={collection.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    id={`access-${collection.id}`}
                    checked={!blocked.includes(collection.id)}
                    onCheckedChange={(checked) =>
                      setBlocked((current) =>
                        checked === true ? current.filter((id) => id !== collection.id) : [...current, collection.id],
                      )
                    }
                  />
                  <Label htmlFor={`access-${collection.id}`} className="flex-1 font-normal text-parchment">
                    {collection.name}
                  </Label>
                  <span className="tabular text-xs text-ash">{collection.entry_ids.length}</span>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !collections.data}>
            Save access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
