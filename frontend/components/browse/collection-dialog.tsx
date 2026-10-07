"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { collectionsApi } from "@/lib/api";
import type { Collection } from "@/lib/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edits this collection; creates a new one when absent. */
  collection?: Collection;
  onSaved: (collection: Collection) => void;
}

export function CollectionDialog({ open, onOpenChange, collection, onSaved }: CollectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit collection" : "Create a collection"}</DialogTitle>
          <DialogDescription>
            {collection
              ? "Rename it, describe it or give it a banner."
              : "Group games you want to keep together. Add games from the library or a game's page."}
          </DialogDescription>
        </DialogHeader>
        {/* Content unmounts on close, so the form resets on every open. */}
        <CollectionForm collection={collection} onSaved={onSaved} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CollectionForm({
  collection,
  onSaved,
  onClose,
}: Pick<CollectionDialogProps, "collection" | "onSaved"> & { onClose: () => void }) {
  const [form, setForm] = useState({
    name: collection?.name ?? "",
    description: collection?.description ?? "",
    visibility: collection?.visibility === "private" ? "private" : "public",
    banner_path: collection?.banner_path ?? "",
    cover_path: collection?.cover_path ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError("Give the collection a name.");
      return;
    }
    // Cleared fields go as null so an edit actually clears them.
    const values = {
      name,
      description: form.description.trim() || null,
      visibility: form.visibility,
      banner_path: form.banner_path.trim() || null,
      cover_path: form.cover_path.trim() || null,
    };
    setSaving(true);
    setError(null);
    try {
      const saved = collection
        ? await collectionsApi.update(collection.id, values)
        : await collectionsApi.create(values);
      toastSuccess(collection ? "Changes saved" : "Collection created");
      onSaved(saved);
      onClose();
    } catch (failure) {
      toastError(failure, "Couldn't save the collection");
      setError("Couldn't save. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="collection-name">Name</Label>
        <Input
          id="collection-name"
          value={form.name}
          onChange={(event) => set("name")(event.target.value)}
          placeholder="Weekend classics"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-description">Description</Label>
        <Textarea
          id="collection-description"
          value={form.description}
          onChange={(event) => set("description")(event.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="collection-visibility">Visibility</Label>
        <Select value={form.visibility} onValueChange={set("visibility")}>
          <SelectTrigger id="collection-visibility" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="collection-banner">Banner image</Label>
          <Input
            id="collection-banner"
            value={form.banner_path}
            onChange={(event) => set("banner_path")(event.target.value)}
            placeholder="Path or URL"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="collection-cover">Cover image</Label>
          <Input
            id="collection-cover"
            value={form.cover_path}
            onChange={(event) => set("cover_path")(event.target.value)}
            placeholder="Path or URL"
          />
        </div>
      </div>
      <p className="text-sm text-ash">Without a banner, the card shows the first four games.</p>

      {error && (
        <p role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {collection ? "Save changes" : "Create collection"}
        </Button>
      </DialogFooter>
    </form>
  );
}
