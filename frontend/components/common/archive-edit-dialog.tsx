"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
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

function buildPayload(
  entry: ArchiveEntry,
  form: ArchiveEditForm,
): Partial<ArchiveEntry> {
  return {
    title: form.title.trim(),
    description: form.description || undefined,
    version: form.version || undefined,
    engine: form.engine || undefined,
    release_date: form.release_date || undefined,
    archive_type: entry.archive_type ?? undefined,
    file_path: entry.file_path,
    storage_device: form.storage_device || undefined,
    cover_path: entry.cover_path ?? undefined,
    banner_path: entry.banner_path ?? undefined,
    logo_path: entry.logo_path ?? undefined,
    metadata_status: entry.metadata_status,
    metadata_source: entry.metadata_source ?? undefined,
    metadata_source_code: entry.metadata_source_code ?? undefined,
    last_metadata_refresh: entry.last_metadata_refresh ?? undefined,
    last_verified: entry.last_verified ?? undefined,
    verification_status: entry.verification_status,
    parent_series_id: entry.parent_series_id ?? undefined,
    franchise_id: entry.franchise_id ?? undefined,
    tag_ids: entry.tag_ids ?? [],
    developer_ids: entry.developer_ids ?? [],
    publisher_ids: entry.publisher_ids ?? [],
    collection_ids: entry.collection_ids ?? [],
    related_entry_ids: entry.related_entry_ids ?? [],
  };
}

export function ArchiveEditDialog({
  entry,
  open,
  onOpenChange,
  onSaved,
}: ArchiveEditDialogProps) {
  const [form, setForm] = useState<ArchiveEditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(entry));
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
      const updated = await archiveApi.update(
        entry.id,
        buildPayload(entry, form),
      );
      toastSuccess("Archive entry updated");
      onSaved(updated);
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Failed to update archive entry");
      setSaveError("Failed to update archive entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>
            Update core details for {entry.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-release-date">Release Date</Label>
            <Input
              id="edit-release-date"
              type="date"
              value={form.release_date}
              onChange={(e) => setField("release_date", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-version">Version</Label>
              <Input
                id="edit-version"
                value={form.version}
                onChange={(e) => setField("version", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-engine">Engine</Label>
              <Input
                id="edit-engine"
                value={form.engine}
                onChange={(e) => setField("engine", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-storage-device">Storage Device</Label>
            <Input
              id="edit-storage-device"
              value={form.storage_device}
              onChange={(e) => setField("storage_device", e.target.value)}
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
