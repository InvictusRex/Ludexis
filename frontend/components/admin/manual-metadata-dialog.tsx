"use client";

import { useEffect, useState } from "react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ManualMetadataDialogProps {
  entry: ArchiveEntry | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

/** Writes metadata by hand and locks it, so scans and refreshes leave it alone. */
export function ManualMetadataDialog({ entry, onOpenChange, onSaved }: ManualMetadataDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTitle(entry.title ?? "");
      setDescription(entry.description ?? "");
      setReleaseDate(entry.release_date?.slice(0, 10) ?? "");
    }
  }, [entry]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!entry) return;
    setSaving(true);
    try {
      await archiveApi.updateMetadata(entry.id, {
        title: title.trim(),
        description: description.trim() || null,
        release_date: releaseDate || null,
        metadata_override: true,
      });
      toastSuccess("Details saved");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toastError(error, "Could not save the details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Edit details by hand</DialogTitle>
            <DialogDescription>
              Hand-edited details are kept as they are; metadata refreshes skip this game until it is identified again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="manual-title">Title</Label>
            <Input id="manual-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-description">Description</Label>
            <Textarea id="manual-description" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-release">Release date</Label>
            <Input
              id="manual-release"
              type="date"
              className="[color-scheme:dark]"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              Save details
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
