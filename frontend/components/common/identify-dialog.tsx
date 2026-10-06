"use client";

import { useEffect, useState } from "react";
import { ImageOff, Loader2, Search } from "lucide-react";
import { archiveApi, metadataApi } from "@/lib/api";
import type { ArchiveEntry, MetadataSearchResult } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDERS = [
  { value: "all", label: "All sources" },
  { value: "VNDB", label: "VNDB" },
  { value: "IGDB", label: "IGDB" },
  { value: "Steam", label: "Steam" },
];

interface IdentifyDialogProps {
  entry: ArchiveEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentified: (updated: ArchiveEntry) => void;
}

export function IdentifyDialog({
  entry,
  open,
  onOpenChange,
  onIdentified,
}: IdentifyDialogProps) {
  const [query, setQuery] = useState(entry.title);
  const [provider, setProvider] = useState("all");
  const [results, setResults] = useState<MetadataSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(entry.title);
      setResults(null);
    }
  }, [open, entry.title]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await metadataApi.searchProvider(query.trim(), provider));
    } catch (error) {
      toastError(error, "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (result: MetadataSearchResult) => {
    const key = `${result.provider}:${result.provider_id}`;
    setApplying(key);
    try {
      const identified = await archiveApi.identify(
        entry.id,
        result.provider,
        result.provider_id,
      );
      const versions =
        identified.updated_entries > 1
          ? ` and ${identified.updated_entries - 1} other version(s)`
          : "";
      toastSuccess(
        `Identified as ${identified.entry.title}${versions}. Artwork is downloading in the background.`,
      );
      onIdentified(identified.entry);
      onOpenChange(false);
    } catch (error) {
      toastError(error, "Failed to apply metadata");
    } finally {
      setApplying(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Identify</DialogTitle>
          <DialogDescription>
            Search a metadata source and pick the right game. Its metadata
            replaces the current metadata on every version of this game.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="identify-query">Title</Label>
            <Input
              id="identify-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-2 sm:w-40">
            <Label htmlFor="identify-provider">Source</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="identify-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </Button>
        </form>

        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {results?.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No results. Try another title or source.
            </p>
          )}
          {results?.map((result) => {
            const key = `${result.provider}:${result.provider_id}`;
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border border-border p-2"
              >
                {result.cover_url ? (
                  <img
                    src={result.cover_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-16 w-12 flex-none rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="flex h-16 w-12 flex-none items-center justify-center rounded bg-muted text-muted-foreground">
                    <ImageOff className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {result.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{result.provider}</Badge>
                    {result.release_date && (
                      <span>{result.release_date.slice(0, 4)}</span>
                    )}
                    <span className="truncate">{result.provider_id}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={applying !== null}
                  onClick={() => handleSelect(result)}
                >
                  {applying === key && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Select
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
