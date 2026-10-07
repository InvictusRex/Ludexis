"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { permissionsApi, rolesApi } from "@/lib/api";
import type { PermissionRead, RoleRead } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/brand/empty-state";
import { humanize } from "./common";

const loadRoles = () => Promise.all([rolesApi.getAll(), permissionsApi.getAll()]);

export function RolesPanel() {
  const data = useApi(loadRoles, []);
  // undefined: closed; null: a new role.
  const [editing, setEditing] = useState<RoleRead | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (role: RoleRead) => {
    if (!window.confirm(`Delete the role "${role.name}"? Users holding it lose its permissions.`)) return;
    setBusyId(role.id);
    try {
      await rolesApi.remove(role.id);
      toastSuccess("Role deleted");
      data.reload();
    } catch (error) {
      toastError(error, "Could not delete the role");
    } finally {
      setBusyId(null);
    }
  };

  if (data.error) {
    return (
      <EmptyState
        title="Roles could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={data.reload}>Try again</Button>}
      />
    );
  }

  if (!data.data) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const [roles, permissions] = data.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ash">A user can do anything any of their roles allows. Superusers skip these checks.</p>
        <Button onClick={() => setEditing(null)}>
          <Plus />
          New role
        </Button>
      </div>

      {roles.length === 0 ? (
        <EmptyState title="No roles yet" description="Create a role, then give it to users from the Users tab." />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y divide-seam">
            {roles.map((role) => (
              <li key={role.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-medium text-parchment">{role.name}</p>
                  {role.description && <p className="text-sm text-ash">{role.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.permissions.length === 0 ? (
                      <span className="text-sm text-ash">No permissions</span>
                    ) : (
                      role.permissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="border-seam text-parchment">
                          {humanize(permission.name)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(role)} aria-label={`Edit ${role.name}`}>
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-ember"
                    disabled={busyId === role.id}
                    onClick={() => remove(role)}
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <RoleDialog
        role={editing}
        permissions={permissions}
        onOpenChange={(open) => !open && setEditing(undefined)}
        onSaved={data.reload}
      />
    </div>
  );
}

function RoleDialog({
  role,
  permissions,
  onOpenChange,
  onSaved,
}: {
  role: RoleRead | null | undefined;
  permissions: PermissionRead[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setPermissionIds(role?.permissions.map((permission) => permission.id) ?? []);
  }, [role]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || null, permission_ids: permissionIds };
      if (role) {
        await rolesApi.update(role.id, payload);
      } else {
        await rolesApi.create(payload);
      }
      toastSuccess(role ? "Role saved" : "Role created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toastError(error, "Could not save the role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={role !== undefined} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{role ? `Edit ${role.name}` : "New role"}</DialogTitle>
            <DialogDescription>Choose what users with this role may do.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input id="role-name" placeholder="Curator" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-parchment">Permissions</legend>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {permissions.map((permission) => (
                <li key={permission.id} className="flex items-center gap-3">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={permissionIds.includes(permission.id)}
                    onCheckedChange={(checked) =>
                      setPermissionIds((ids) =>
                        checked === true ? [...ids, permission.id] : ids.filter((id) => id !== permission.id),
                      )
                    }
                  />
                  <Label htmlFor={`permission-${permission.id}`} className="font-normal text-parchment">
                    {humanize(permission.name)}
                  </Label>
                </li>
              ))}
            </ul>
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {role ? "Save role" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
