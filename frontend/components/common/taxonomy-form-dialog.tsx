"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { toastError } from "@/lib/toast";
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

export interface TaxonomyField<K extends string> {
  key: K;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

/** Cleared optional fields are sent as `null` so a PATCH clears them. */
export type TaxonomyFormValues<K extends string> = { name: string } & Record<
  K,
  string | null
>;

const DESCRIPTION_FIELD = {
  key: "description",
  label: "Description",
  multiline: true,
} as const;

const WEBSITE_FIELD = {
  key: "website",
  label: "Website",
  placeholder: "https://",
} as const;

/** Optional fields each taxonomy form edits, in addition to the name. */
export const TAXONOMY_FIELDS = {
  tags: [
    DESCRIPTION_FIELD,
    { key: "color", label: "Color", placeholder: "#FF9900" },
  ],
  developers: [DESCRIPTION_FIELD, WEBSITE_FIELD],
  publishers: [DESCRIPTION_FIELD, WEBSITE_FIELD],
  franchises: [
    DESCRIPTION_FIELD,
    { key: "banner_path", label: "Banner Path" },
  ],
} as const satisfies Record<string, readonly TaxonomyField<string>[]>;

interface TaxonomyFormDialogProps<K extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fields: readonly TaxonomyField<K>[];
  initial?: { name?: string } & Partial<Record<K, string | null>>;
  onSubmit: (values: TaxonomyFormValues<K>) => Promise<void>;
}

export function TaxonomyFormDialog<K extends string>({
  open,
  onOpenChange,
  title,
  description,
  ...formProps
}: TaxonomyFormDialogProps<K>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Content unmounts on close, so the form state resets on every open. */}
        <TaxonomyForm {...formProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TaxonomyForm<K extends string>({
  fields,
  initial,
  onSubmit,
  onClose,
}: Pick<TaxonomyFormDialogProps<K>, "fields" | "initial" | "onSubmit"> & {
  onClose: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      ["name", ...fields.map((f) => f.key)].map((key) => [
        key,
        (initial as Record<string, string | null | undefined> | undefined)?.[
          key
        ] ?? "",
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setSaveError("Name is required");
      return;
    }
    const values = {
      name,
      ...Object.fromEntries(
        fields.map((f) => [f.key, form[f.key].trim() || null]),
      ),
    } as TaxonomyFormValues<K>;

    setSaving(true);
    setSaveError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (error) {
      toastError(error, "Failed to save");
      setSaveError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="taxonomy-name">Name</Label>
        <Input
          id="taxonomy-name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </div>

      {fields.map((field) => {
        const Control = field.multiline ? Textarea : Input;
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`taxonomy-${field.key}`}>{field.label}</Label>
            <Control
              id={`taxonomy-${field.key}`}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
            />
          </div>
        );
      })}

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{saveError}</span>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
