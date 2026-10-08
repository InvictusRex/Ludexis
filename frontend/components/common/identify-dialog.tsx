"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { archiveApi, metadataApi } from "@/lib/api";
import type { ArchiveEntry, MetadataSearchResult } from "@/lib/types";
import { year } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { useApi } from "@/hooks/use-api";
import { announceReviewChanged } from "@/hooks/use-review-count";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";


interface IdentifyDialogProps {
  entry: ArchiveEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentified: (updated: ArchiveEntry) => void;
}

/** Provider cover thumbnails are remote URLs, so they load without a referrer and fall back quietly. */
function ResultCover({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[2/3] w-12 flex-none overflow-hidden rounded bg-night">
      {url && !failed && (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover object-center"
        />
      )}
    </div>
  );
}

export function IdentifyDialog({ entry, open, onOpenChange, onIdentified }: IdentifyDialogProps) {
  const [query, setQuery] = useState(entry.title);
  const [developer, setDeveloper] = useState("");
  const [provider, setProvider] = useState("all");
  const providers = useApi(() => metadataApi.providers(), []);
  const [results, setResults] = useState<MetadataSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(entry.title);
      setDeveloper("");
      setResults(null);
    }
  }, [open, entry.title]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      setResults(await metadataApi.searchProvider(query.trim(), provider, developer));
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
      const identified = await archiveApi.identify(entry.id, result.provider, result.provider_id);
      const others = identified.updated_entries - 1;
      const versions = others > 0 ? ` and ${others} other version${others === 1 ? "" : "s"}` : "";
      toastSuccess(`Identified as ${identified.entry.title}${versions}. Artwork is downloading in the background.`);
      // Identify starts an artwork job; let the activity indicator pick it up now.
      announceJobsChanged();
      announceReviewChanged();
      onIdentified(identified.entry);
      onOpenChange(false);
    } catch (error) {
      toastError(error, "The match could not be applied");
    } finally {
      setApplying(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Identify game</DialogTitle>
          <DialogDescription>
            Search a metadata source and pick the right game. Its details replace the current ones on every version
            of this game.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="identify-query">Title</Label>
              <Input id="identify-query" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identify-developer">
                Developer <span className="font-normal text-ash">(optional)</span>
              </Label>
              <Input
                id="identify-developer"
                value={developer}
                onChange={(event) => setDeveloper(event.target.value)}
                placeholder="Helps tell apart games with the same name"
              />
            </div>
          </div>
          <div className="space-y-2 sm:w-40">
            <Label htmlFor="identify-provider">Source</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="identify-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {(providers.data ?? []).map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={searching || !query.trim()}>
            {searching ? <Loader2 className="animate-spin" /> : <Search />}
            Search
          </Button>
        </form>

        <div className="-mx-2 max-h-[50vh] overflow-y-auto px-2" aria-busy={searching}>
          {searching && !results ? (
            <div className="space-y-2">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-20 w-full" />
              ))}
            </div>
          ) : results?.length === 0 ? (
            <p className="py-8 text-center text-sm text-ash">No results. Try another title or source.</p>
          ) : (
            <ul className="space-y-1">
              {results?.map((result) => {
                const key = `${result.provider}:${result.provider_id}`;
                return (
                  <li key={key} className="flex items-center gap-3 rounded-lg p-2 hover:bg-night/40">
                    <ResultCover url={result.cover_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-parchment">{result.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ash">
                        <span className="font-medium text-violet-lit">{result.provider}</span>
                        {result.release_date && <span className="tabular">{year(result.release_date)}</span>}
                        {!!result.developers?.length && <span className="truncate">{result.developers.join(", ")}</span>}
                        <span className="truncate">#{result.provider_id}</span>
                      </p>
                      {result.summary && <p className="mt-1 line-clamp-2 text-xs text-ash">{result.summary}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={applying !== null}
                      onClick={() => handleSelect(result)}
                      aria-label={`Select ${result.title} from ${result.provider}`}
                    >
                      {applying === key && <Loader2 className="animate-spin" />}
                      Select
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
