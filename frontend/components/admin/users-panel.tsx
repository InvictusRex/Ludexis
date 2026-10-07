"use client";

import { useState } from "react";
import { KeyRound, MoreHorizontal, Plus, ShieldCheck, Trash2, UserCheck, UserX } from "lucide-react";
import { rolesApi, usersApi } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/brand/empty-state";
import { Pager, Status, splitPage } from "./common";
import { CreateUserDialog, ResetPasswordDialog, UserRolesDialog } from "./user-dialogs";

const PAGE_SIZE = 50;

export function UsersPanel() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const users = useApi(
    () => usersApi.getAll((page - 1) * PAGE_SIZE, PAGE_SIZE + 1).then((rows) => splitPage(rows, PAGE_SIZE)),
    [page],
  );
  const roles = useApi(() => rolesApi.getAll(), []);
  const [creating, setCreating] = useState(false);
  const [editingRoles, setEditingRoles] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (target: User, action: () => Promise<unknown>, done: string, failed: string) => {
    setBusyId(target.id);
    try {
      await action();
      toastSuccess(done);
      users.reload();
    } catch (error) {
      toastError(error, failed);
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = (target: User) =>
    target.is_active
      ? act(target, () => usersApi.deactivate(target.id), `${target.username} can no longer sign in`, "Could not deactivate the user")
      : act(target, () => usersApi.activate(target.id), `${target.username} can sign in again`, "Could not activate the user");

  const remove = (target: User) => {
    if (!window.confirm(`Delete ${target.username}? They will no longer be able to sign in.`)) return;
    act(target, () => usersApi.remove(target.id), `${target.username} deleted`, "Could not delete the user");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus />
          Add user
        </Button>
      </div>

      {users.error ? (
        <EmptyState
          title="Users could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={users.reload}>Try again</Button>}
        />
      ) : !users.data ? (
        <Card className="gap-3 px-5">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.rows.map((user) => {
                const isMe = user.id === me?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="py-3 pl-5">
                      <p className="font-medium text-parchment">
                        {user.username}
                        {isMe && <span className="ml-2 text-xs font-normal text-ash">You</span>}
                      </p>
                      <p className="text-xs text-ash">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {user.is_superuser && (
                          <Badge variant="outline" className="border-violet-lit/50 text-violet-lit">
                            Superuser
                          </Badge>
                        )}
                        {user.roles?.map((role) => (
                          <Badge key={role.id} variant="outline" className="border-seam text-parchment">
                            {role.name}
                          </Badge>
                        ))}
                        {!user.is_superuser && !user.roles?.length && <span className="text-sm text-ash">No roles</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Status tone={user.is_active ? "ok" : "idle"}>{user.is_active ? "Active" : "Deactivated"}</Status>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.username}`} disabled={busyId === user.id}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditingRoles(user)}>
                            <ShieldCheck />
                            Change roles
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setResetting(user)}>
                            <KeyRound />
                            Reset password
                          </DropdownMenuItem>
                          {/* Locking yourself out from here would need another admin to undo. */}
                          {!isMe && (
                            <>
                              <DropdownMenuItem onSelect={() => toggleActive(user)}>
                                {user.is_active ? <UserX /> : <UserCheck />}
                                {user.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => remove(user)}>
                                <Trash2 />
                                Delete user
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pager page={page} hasMore={users.data?.hasMore ?? false} onPage={setPage} />

      <CreateUserDialog open={creating} onOpenChange={setCreating} roles={roles.data ?? []} onCreated={users.reload} />
      <UserRolesDialog
        user={editingRoles}
        roles={roles.data ?? []}
        onOpenChange={(open) => !open && setEditingRoles(null)}
        onSaved={users.reload}
      />
      <ResetPasswordDialog user={resetting} onOpenChange={(open) => !open && setResetting(null)} />
    </div>
  );
}
