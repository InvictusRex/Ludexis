"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry, ArchiveEntryUpdate } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface ArchiveEditForm {
  title: string;
  description: string;
  version: string;
  engine: string;
  release_date: string;
  storage_device: string;
}

interface ArchiveEditDialogProps {
  entry: ArchiveEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: ArchiveEntry) => void;
}

const EMPTY_FORM: ArchiveEditForm = {
  title: "",
  description: "",
  version: "",
  engine: "",
  release_date: "",
  storage_device: "",
};

function toForm(entry: ArchiveEntry): ArchiveEditForm {
  return {
    title: entry.title ?? "",
    description: entry.description ?? "",
    version: entry.version ?? "",
    engine: entry.engine ?? "",
    release_date: entry.release_date ? entry.release_date.slice(0, 10) : "",
    storage_device: entry.storage_device ?? "",
  };
}

function buildPayload(form: ArchiveEditForm): ArchiveEntryUpdate {
  return {
    title: form.title.trim(),
    description: form.description || null,
    version: form.version || null,
    engine: form.engine || null,
    release_date: form.release_date || null,
    storage_device: form.storage_device || null,
  };
}

export function ArchiveEditDialog({
  entry,
  open,
  onOpenChange,
  onSaved,
}: ArchiveEditDialogProps) {
  const [form, setForm] = useState<ArchiveEditForm>(EMPTY_FORM);
  const [restricted, setRestricted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(entry));
      setRestricted(!!entry.restricted);
      setSaveError(null);
      setSaving(false);
    }
  }, [open, entry]);

  const setField = (field: keyof ArchiveEditForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setSaveError("Title is required");
      return;
    }
    if (form.release_date && isNaN(new Date(form.release_date).getTime())) {
      setSaveError("Release date is invalid");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      // Sent only when changed: setting it locks the mark against metadata refreshes.
      const payload = { ...buildPayload(form), ...(restricted !== !!entry.restricted && { restricted }) };
      const updated = await archiveApi.update(entry.id, payload);
      toastSuccess("Game updated");
      onSaved(updated);
      onOpenChange(false);
    } catch (error) {
      toastError(error, "The game could not be saved");
      setSaveError("The game could not be saved. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit game</DialogTitle>
          <DialogDescription>Change the details stored for {entry.title}.</DialogDescription>
        </DialogHeader>
        <form
          id="archive-edit-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              rows={5}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-release-date">Release date</Label>
              <Input
                id="edit-release-date"
                type="date"
                value={form.release_date}
                onChange={(e) => setField("release_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-version">Version</Label>
              <Input id="edit-version" value={form.version} onChange={(e) => setField("version", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-engine">Engine</Label>
              <Input id="edit-engine" value={form.engine} onChange={(e) => setField("engine", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-storage-device">Storage device</Label>
              <Input
                id="edit-storage-device"
                value={form.storage_device}
                onChange={(e) => setField("storage_device", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-seam px-3 py-3">
            <div>
              <Label htmlFor="edit-restricted" className="text-parchment">
                Restricted
              </Label>
              <p className="mt-1 text-sm text-ash">
                Only accounts allowed restricted content see this game.
                {entry.restricted_locked ? " Set by hand." : " Metadata sources set this from their age ratings."}
              </p>
            </div>
            <Switch id="edit-restricted" checked={restricted} onCheckedChange={setRestricted} />
          </div>

          {saveError && (
            <p role="alert" className="flex items-center gap-2 rounded-lg bg-ember/10 px-3 py-2 text-sm text-ember">
              <AlertCircle className="size-4 shrink-0" />
              {saveError}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="archive-edit-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
