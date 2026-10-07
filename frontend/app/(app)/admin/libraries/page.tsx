"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { librariesApi } from "@/lib/api";
import type { LibraryRead } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/brand/empty-state";
import { SectionHeader, Status, dateTime } from "@/components/admin/common";
import { LibraryDialog } from "@/components/admin/library-dialog";
import { ScanButtons } from "@/components/admin/scan-buttons";

export default function DashboardLibraries() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "ACCESS_ADMIN");

  const libraries = useApi(() => librariesApi.getAll(), []);
  const [editing, setEditing] = useState<LibraryRead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!can(user, "ACCESS_ADMIN")) {
    return null;
  }

  const openDialog = (library: LibraryRead | null) => {
    setEditing(library);
    setDialogOpen(true);
  };

  const toggle = async (library: LibraryRead, enabled: boolean) => {
    setBusyId(library.id);
    try {
      await librariesApi.update(library.id, { enabled });
      libraries.reload();
    } catch (error) {
      toastError(error, "Could not update the library");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (library: LibraryRead) => {
    if (!window.confirm(`Remove the library "${library.name}"? Files on disk are not touched.`)) return;
    setBusyId(library.id);
    try {
      await librariesApi.remove(library.id);
      toastSuccess("Library removed");
      libraries.reload();
    } catch (error) {
      toastError(error, "Could not remove the library");
    } finally {
      setBusyId(null);
    }
  };

  const addButton = (
    <Button variant="outline" onClick={() => openDialog(null)}>
      <Plus />
      Add library
    </Button>
  );

  return (
    <div>
      <SectionHeader
        title="Libraries"
        description="Folders the server scans for games. A drive that is disconnected shows as offline and is checked again at the next scan."
        actions={
          <>
            {addButton}
            {can(user, "RUN_SCANS") && <ScanButtons />}
          </>
        }
      />

      {libraries.error ? (
        <EmptyState
          title="Libraries could not be loaded"
          description="Check that the server is running, then try again."
          action={<Button onClick={libraries.reload}>Try again</Button>}
        />
      ) : libraries.loading && !libraries.data ? (
        <Card className="gap-3 px-5">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-12 w-full" />
          ))}
        </Card>
      ) : libraries.data?.length === 0 ? (
        <EmptyState
          title="No library folders yet"
          description="Add the folder where your games live, then run a scan to fill the library."
          action={addButton}
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Library</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last scan</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {libraries.data?.map((library) => {
                const offline = library.status === "OFFLINE";
                return (
                  <TableRow key={library.id}>
                    <TableCell className="py-3 pl-5">
                      <p className="font-medium text-parchment">{library.name}</p>
                      <p className="max-w-[28rem] truncate font-mono text-xs text-ash" title={library.path}>
                        {library.path}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Status tone={offline ? "bad" : "ok"}>{offline ? "Offline" : "Online"}</Status>
                      {offline && library.last_error && (
                        <p className="mt-1 max-w-64 truncate text-xs text-ash" title={library.last_error}>
                          {library.last_error}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="tabular text-ash">{dateTime(library.last_scan_at)}</TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Scan ${library.name}`}
                        checked={library.enabled}
                        disabled={busyId === library.id}
                        onCheckedChange={(enabled) => toggle(library, enabled)}
                      />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${library.name}`} disabled={busyId === library.id}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openDialog(library)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => remove(library)}>
                            <Trash2 />
                            Remove
                          </DropdownMenuItem>
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

      <LibraryDialog open={dialogOpen} onOpenChange={setDialogOpen} library={editing} onSaved={libraries.reload} />
    </div>
  );
}
