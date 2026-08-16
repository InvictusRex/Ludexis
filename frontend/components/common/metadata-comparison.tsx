"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GitCompare, RefreshCw } from "lucide-react";
import { metadataApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type {
  ArchiveEntry,
  MetadataDetails,
  MetadataSearchResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface ComparisonRow {
  field: string;
  stored: string;
  candidate: string;
  differs: boolean;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatList(values?: string[]): string {
  return values && values.length > 0 ? values.join(", ") : "—";
}

export function MetadataComparison({
  entry,
  storedDevelopers = [],
  storedPublishers = [],
}: {
  entry: ArchiveEntry;
  storedDevelopers?: string[];
  storedPublishers?: string[];
}) {
  const [results, setResults] = useState<MetadataSearchResult[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [details, setDetails] = useState<MetadataDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    setError(null);
    try {
      const found = await metadataApi.search(entry.title);
      setResults(found);
      if (found.length > 0) {
        setSelectedKey(`${found[0].provider}:${found[0].provider_id}`);
      }
    } catch (err) {
      toastError(err, "Failed to load provider candidates.");
      setError("Failed to load provider candidates. Please try again.");
      setResults([]);
    }
  }, [entry.title]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    if (!selectedKey) {
      setDetails(null);
      return;
    }
    const separatorIndex = selectedKey.indexOf(":");
    const provider = selectedKey.slice(0, separatorIndex);
    const providerId = selectedKey.slice(separatorIndex + 1);

    let cancelled = false;
    setLoadingDetails(true);
    metadataApi
      .getDetails(provider, providerId)
      .then((result) => {
        if (!cancelled) setDetails(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toastError(err, "Failed to load provider metadata.");
          setDetails(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  const rows = useMemo<ComparisonRow[]>(() => {
    if (!details) return [];
    const pairs: Array<{ field: string; stored: string; candidate: string }> = [
      { field: "Title", stored: entry.title, candidate: details.title },
      {
        field: "Description",
        stored: entry.description ?? "—",
        candidate: details.description ?? "—",
      },
      {
        field: "Release Date",
        stored: formatDate(entry.release_date),
        candidate: formatDate(details.release_date),
      },
      {
        field: "Developers",
        stored: formatList(storedDevelopers),
        candidate: formatList(details.developers),
      },
      {
        field: "Publishers",
        stored: formatList(storedPublishers),
        candidate: formatList(details.publishers),
      },
    ];
    return pairs.map((pair) => ({
      ...pair,
      differs: normalize(pair.stored) !== normalize(pair.candidate),
    }));
  }, [details, entry, storedDevelopers, storedPublishers]);

  const differingCount = rows.filter((row) => row.differs).length;

  const renderBody = () => {
    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={loadResults}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }
    if (results === null) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitCompare className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No provider candidates found</EmptyTitle>
            <EmptyDescription>
              No provider returned a match for &ldquo;{entry.title}&rdquo;.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }

    return (
      <>
        <div className="space-y-2 max-w-md">
          <Label htmlFor="metadata-candidate">Provider candidate</Label>
          <Select
            value={selectedKey ?? undefined}
            onValueChange={setSelectedKey}
          >
            <SelectTrigger id="metadata-candidate">
              <SelectValue placeholder="Select a candidate" />
            </SelectTrigger>
            <SelectContent>
              {results.map((result) => (
                <SelectItem
                  key={`${result.provider}:${result.provider_id}`}
                  value={`${result.provider}:${result.provider_id}`}
                >
                  {result.title} · {result.provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loadingDetails ? (
          <div className="space-y-3 mt-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : details ? (
          <>
            <div className="flex items-center gap-2 mt-6">
              <Badge
                variant="outline"
                className={cn(
                  differingCount > 0
                    ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                    : "bg-green-500/15 text-green-600 border-green-500/30",
                )}
              >
                {differingCount === 0
                  ? "No differences"
                  : `${differingCount} field${
                      differingCount === 1 ? "" : "s"
                    } differ`}
              </Badge>
            </div>

            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-[minmax(6rem,10rem)_1fr_1fr] bg-muted/50 text-sm font-medium text-foreground">
                <div className="p-3">Field</div>
                <div className="p-3 border-l border-border">Stored</div>
                <div className="p-3 border-l border-border">
                  {details.provider}
                </div>
              </div>
              {rows.map((row) => (
                <div
                  key={row.field}
                  className={cn(
                    "grid grid-cols-[minmax(6rem,10rem)_1fr_1fr] border-t border-border text-sm",
                    row.differs && "bg-amber-500/5",
                  )}
                  data-differs={row.differs ? "true" : "false"}
                >
                  <div className="p-3 text-muted-foreground">{row.field}</div>
                  <div className="p-3 border-l border-border text-foreground">
                    {row.stored}
                  </div>
                  <div
                    className={cn(
                      "p-3 border-l border-border",
                      row.differs
                        ? "text-amber-600 font-medium"
                        : "text-foreground",
                    )}
                  >
                    {row.candidate}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompare className="w-5 h-5" />
          Metadata Comparison
        </CardTitle>
        <CardDescription>
          Stored metadata side-by-side with provider candidates
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
