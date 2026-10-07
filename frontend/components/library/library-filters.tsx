"use client";

import { useEffect, useId, useState } from "react";
import { collectionsApi, developersApi, franchisesApi, genresApi, publishersApi, tagsApi } from "@/lib/api";
import type { MetadataStatus, VerificationStatus } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { metadataLabel, verificationLabel } from "@/components/media/status-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FILTER_KEYS, type FilterKey } from "./library-params";

export type LibraryFilters = Partial<Record<FilterKey, string>>;

export const FILTER_LABELS: Record<FilterKey, string> = {
  genre: "Genre",
  tag: "Tag",
  developer: "Developer",
  publisher: "Publisher",
  franchise: "Franchise",
  collection: "Collection",
  metadata_status: "Metadata status",
  verification_status: "File status",
};

const METADATA_STATUSES: MetadataStatus[] = ["MATCHED", "PARTIAL", "UNMATCHED", "MANUAL"];
const VERIFICATION_STATUSES: VerificationStatus[] = ["VERIFIED", "MISSING", "MOVED", "CORRUPTED", "UNKNOWN"];

/** How an active filter reads in its chip: statuses speak for themselves, names get their field. */
export function filterChipLabel(key: FilterKey, value: string): string {
  if (key === "metadata_status") return metadataLabel(value as MetadataStatus);
  if (key === "verification_status") return verificationLabel(value as VerificationStatus);
  return `${FILTER_LABELS[key]}: ${value}`;
}

const names = (page: { items: { name: string }[] }) => page.items.map((item) => item.name);

// Name lookups for the free-text filters; the server filters by name, so suggestions stay small.
const SUGGEST: Partial<Record<FilterKey, (q: string) => Promise<string[]>>> = {
  tag: (q) => tagsApi.getAll(0, 20, q).then(names),
  developer: (q) => developersApi.getAll(0, 20, q).then(names),
  publisher: (q) => publishersApi.getAll(0, 20, q).then(names),
  franchise: (q) => franchisesApi.getAll(0, 20, q).then(names),
  collection: (q) => collectionsApi.getAll(0, 20, q).then((items) => items.map((item) => item.name)),
};

const ANY = "__any";

function NameField({ field, value, onChange }: { field: FilterKey; value: string; onChange: (value: string) => void }) {
  const id = useId();
  const [options, setOptions] = useState<string[]>([]);
  const suggest = SUGGEST[field];

  useEffect(() => {
    if (!suggest) return;
    const timer = setTimeout(() => suggest(value).then(setOptions, () => setOptions([])), 250);
    return () => clearTimeout(timer);
  }, [suggest, value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{FILTER_LABELS[field]}</Label>
      <Input
        id={id}
        list={`${id}-options`}
        autoComplete="off"
        placeholder="Any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={`${id}-options`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

function ChoiceField({
  field,
  value,
  options,
  onChange,
}: {
  field: FilterKey;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{FILTER_LABELS[field]}</Label>
      <Select value={value || ANY} onValueChange={(next) => onChange(next === ANY ? "" : next)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface FilterSheetProps {
  filters: LibraryFilters;
  onApply: (filters: LibraryFilters) => void;
}

/** The body of the library's filter sheet; mounted only while the sheet is open. */
export function FilterSheetContent({ filters, onApply }: FilterSheetProps) {
  const [draft, setDraft] = useState<LibraryFilters>(filters);
  const genres = useApi(() => genresApi.getAll(), []);
  const set = (key: FilterKey) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const clear = Object.fromEntries(FILTER_KEYS.map((key) => [key, ""])) as LibraryFilters;

  const genreOptions = (genres.data ?? []).map((genre) => ({
    value: genre.name,
    label: `${genre.name} (${genre.entry_count.toLocaleString()})`,
  }));
  // Keep a genre from the URL selectable even if the list has not loaded or no longer has it.
  if (draft.genre && !genreOptions.some((option) => option.value === draft.genre)) {
    genreOptions.unshift({ value: draft.genre, label: draft.genre });
  }

  return (
    <SheetContent className="gap-0 p-0">
      <div className="border-b border-seam px-6 pb-4 pt-5">
        <SheetTitle>Filters</SheetTitle>
        <SheetDescription className="mt-1">Names must match exactly; suggestions appear as you type.</SheetDescription>
      </div>
      <form
        className="flex flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          onApply(draft);
        }}
      >
        <div className="flex-1 space-y-5 px-6 py-5">
          <ChoiceField field="genre" value={draft.genre ?? ""} options={genreOptions} onChange={set("genre")} />
          {(["tag", "developer", "publisher", "franchise", "collection"] as const).map((field) => (
            <NameField key={field} field={field} value={draft[field] ?? ""} onChange={set(field)} />
          ))}
          <ChoiceField
            field="metadata_status"
            value={draft.metadata_status ?? ""}
            options={METADATA_STATUSES.map((status) => ({ value: status, label: metadataLabel(status) }))}
            onChange={set("metadata_status")}
          />
          <ChoiceField
            field="verification_status"
            value={draft.verification_status ?? ""}
            options={VERIFICATION_STATUSES.map((status) => ({ value: status, label: verificationLabel(status) }))}
            onChange={set("verification_status")}
          />
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t border-seam bg-vault px-6 py-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setDraft(clear)}>
            Reset
          </Button>
          <Button type="submit" className="flex-1">
            Show results
          </Button>
        </div>
      </form>
    </SheetContent>
  );
}
