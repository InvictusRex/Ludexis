"use client";

import { useEffect, useState } from "react";
import { librariesApi } from "@/lib/api";
import type { LibraryRead } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this library; add a new one when absent. */
  library?: LibraryRead | null;
  onSaved: () => void;
}

export function LibraryDialog({ open, onOpenChange, library, onSaved }: LibraryDialogProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(library?.name ?? "");
      setPath(library?.path ?? "");
    }
  }, [open, library]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const data = { name: name.trim(), path: path.trim() };
      if (library) {
        await librariesApi.update(library.id, data);
      } else {
        await librariesApi.create(data);
      }
      toastSuccess(library ? "Library saved" : "Library added");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toastError(error, "Could not save the library");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{library ? "Edit library" : "Add library"}</DialogTitle>
            <DialogDescription>A folder on the server that holds game archives. Scans look inside it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="library-name">Name</Label>
            <Input id="library-name" placeholder="External drive" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="library-path">Folder path</Label>
            <Input
              id="library-path"
              className="font-mono"
              placeholder="/mnt/games"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !path.trim()}>
              {library ? "Save changes" : "Add library"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
