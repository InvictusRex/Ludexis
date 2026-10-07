"use client";

import { useEffect, useState } from "react";
import { adminApi, usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/brand/empty-state";
import { NativeSelect, Pager, SectionHeader, dateTime, humanize, splitPage } from "@/components/admin/common";

const PAGE_SIZE = 50;

// Mirrors AuditAction in the backend; the API filters on exact values.
const ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "LOGOUT_ALL",
  "CHANGE_PASSWORD",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "ACTIVATE_USER",
  "DEACTIVATE_USER",
  "RESET_PASSWORD",
  "CREATE_ROLE",
  "UPDATE_ROLE",
  "DELETE_ROLE",
  "CREATE_LIBRARY",
  "UPDATE_LIBRARY",
  "DELETE_LIBRARY",
  "RUN_FULL_SCAN",
  "RUN_INCREMENTAL_SCAN",
  "START_JOB",
  "CANCEL_JOB",
  "IDENTIFY_ARCHIVE",
  "MANUAL_METADATA_OVERRIDE",
  "UPLOAD_ARTWORK",
  "REPLACE_ARTWORK",
  "DELETE_ARTWORK",
  "AUTO_DOWNLOAD_ARTWORK",
  "UPDATE_SCHEDULED_TASK",
  "RUN_SCHEDULED_TASK",
  "UPDATE_SETTINGS",
];

export default function DashboardLogs() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "VIEW_AUDIT_LOGS");
  const allowed = can(user, "VIEW_AUDIT_LOGS");
  const canListUsers = can(user, "MANAGE_USERS");

  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [entityInput, setEntityInput] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);

  // Typing in the entity box waits for a pause before querying.
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntity(entityInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [entityInput]);

  const logs = useApi(
    () =>
      allowed
        ? adminApi
            .getAuditLogs({
              action: action || undefined,
              user_id: userId || undefined,
              entity: entity || undefined,
              offset: (page - 1) * PAGE_SIZE,
              limit: PAGE_SIZE + 1,
            })
            .then((rows) => splitPage(rows, PAGE_SIZE))
        : Promise.resolve(undefined),
    [allowed, action, userId, entity, page],
  );
  const users = useApi(() => (canListUsers ? usersApi.getAll(0, 200) : Promise.resolve([])), [canListUsers]);

  if (!allowed) {
    return null;
  }

  const names = new Map(users.data?.map((u) => [u.id, u.username]));
  const filtered = Boolean(action || userId || entity);

  return (
    <div className="space-y-4">
      <SectionHeader title="Activity log" description="Sign-ins and every change made to users, libraries, games and settings." />

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="log-action">Action</Label>
          <NativeSelect
            id="log-action"
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any action</option>
            {ACTIONS.map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </NativeSelect>
        </div>
        {canListUsers && (
          <div className="space-y-1.5">
            <Label htmlFor="log-user">User</Label>
            <NativeSelect
              id="log-user"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Anyone</option>
              {users.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="log-entity">Target</Label>
          <Input
            id="log-entity"
            className="h-9 w-44"
            placeholder="User, Library…"
            value={entityInput}
            onChange={(event) => setEntityInput(event.target.value)}
          />
        </div>
      </div>

      {logs.error ? (
        <EmptyState
          title="The activity log could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={logs.reload}>Try again</Button>}
        />
      ) : !logs.data ? (
        <Card className="gap-3 px-5">
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-9 w-full" />
          ))}
        </Card>
      ) : logs.data.rows.length === 0 ? (
        <EmptyState
          title={filtered ? "Nothing matches these filters" : "No activity yet"}
          description={filtered ? "Try another action, user or target." : "Sign-ins and changes will be recorded here."}
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="pr-5">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.data.rows.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="tabular py-2.5 pl-5 text-ash">{dateTime(log.created_at)}</TableCell>
                  <TableCell className="text-parchment">
                    {log.user_id ? (names.get(log.user_id) ?? <span className="font-mono text-xs text-ash">{log.user_id.slice(0, 8)}</span>) : "System"}
                  </TableCell>
                  <TableCell className="text-parchment">{humanize(log.action)}</TableCell>
                  <TableCell className="text-ash">{log.entity}</TableCell>
                  <TableCell className="pr-5 text-ash">
                    <span className="block max-w-[24rem] truncate" title={log.details ?? undefined}>
                      {log.details ?? "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pager page={page} hasMore={logs.data?.hasMore ?? false} onPage={setPage} />
    </div>
  );
}
