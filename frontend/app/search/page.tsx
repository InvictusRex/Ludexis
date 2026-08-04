"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchFilters, SearchResults } from "@/lib/types";
import { searchApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import {
  deleteSavedSearch,
  loadSavedSearches,
  loadSearchState,
  saveSearch,
  saveSearchState,
} from "@/lib/saved-searches";
import type { SavedSearch, SearchState } from "@/lib/saved-searches";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { CollectionCard } from "@/components/common/collection-card";
import { TagCard } from "@/components/common/tag-card";
import { DeveloperCard } from "@/components/common/developer-card";
import {
  AdvancedSearchBuilder,
  type SearchCondition,
  type SearchField,
} from "@/components/common/advanced-search-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastInfo, toastSuccess } from "@/lib/toast";
import {
  BookmarkPlus,
  FileText,
  ListFilter,
  Search,
  Trash2,
} from "lucide-react";

const METADATA_STATUSES = ["MATCHED", "PARTIAL", "UNMATCHED", "MANUAL"];
const VERIFICATION_STATUSES = [
  "VERIFIED",
  "MISSING",
  "MOVED",
  "CORRUPTED",
  "UNKNOWN",
];

const ENTRY_FIELD_VALUES: Partial<
  Record<SearchField, (entry: SearchResults["entries"][number]) => string>
> = {
  query: (entry) => entry.title,
  storageDevice: (entry) => entry.storage_device ?? "",
  metadataStatus: (entry) => entry.metadata_status,
  verificationStatus: (entry) => entry.verification_status,
};

function applyExclusions(
  data: SearchResults,
  exclusions: SearchCondition[],
): SearchResults {
  if (exclusions.length === 0) {
    return data;
  }

  const entries = data.entries.filter((entry) =>
    exclusions.every((condition) => {
      const read = ENTRY_FIELD_VALUES[condition.field];
      if (!read) {
        return true;
      }
      return (
        read(entry).trim().toLowerCase() !==
        condition.value.trim().toLowerCase()
      );
    }),
  );

  const removed = data.entries.length - entries.length;

  return { ...data, entries, total: data.total - removed };
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [genre, setGenre] = useState("");
  const [tag, setTag] = useState("");
  const [developer, setDeveloper] = useState("");
  const [publisher, setPublisher] = useState("");
  const [franchise, setFranchise] = useState("");
  const [metadataStatus, setMetadataStatus] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [storageDevice, setStorageDevice] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(!!initialQuery);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [restored, setRestored] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [exclusions, setExclusions] = useState<SearchCondition[]>([]);

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const currentState: SearchState = useMemo(
    () => ({
      query,
      genre,
      tag,
      developer,
      publisher,
      franchise,
      metadataStatus,
      verificationStatus,
      storageDevice,
    }),
    [
      query,
      genre,
      tag,
      developer,
      publisher,
      franchise,
      metadataStatus,
      verificationStatus,
      storageDevice,
    ],
  );

  const filters: SearchFilters = useMemo(
    () => ({
      genres: genre ? [genre] : undefined,
      tags: tag ? [tag] : undefined,
      developers: developer ? [developer] : undefined,
      publishers: publisher ? [publisher] : undefined,
      franchises: franchise ? [franchise] : undefined,
      metadataStatus: metadataStatus ? [metadataStatus] : undefined,
      verificationStatus: verificationStatus ? [verificationStatus] : undefined,
      storageDevices: storageDevice ? [storageDevice] : undefined,
    }),
    [
      genre,
      tag,
      developer,
      publisher,
      franchise,
      metadataStatus,
      verificationStatus,
      storageDevice,
    ],
  );

  useEffect(() => {
    setSavedSearches(loadSavedSearches());
    const saved = loadSearchState();
    if (saved) {
      setQuery(saved.query);
      setGenre(saved.genre);
      setTag(saved.tag);
      setDeveloper(saved.developer);
      setPublisher(saved.publisher);
      setFranchise(saved.franchise);
      setMetadataStatus(saved.metadataStatus);
      setVerificationStatus(saved.verificationStatus);
      setStorageDevice(saved.storageDevice);
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) {
      return;
    }
    saveSearchState(currentState);
  }, [restored, currentState]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const performSearch = async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }

      if (!user) {
        return;
      }

      setLoading(true);
      try {
        const data = await searchApi.search(query, filters);
        setResults(applyExclusions(data, exclusions));
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, filters, exclusions, authLoading, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleSaveSearch = () => {
    const name = window.prompt("Name this saved search");
    if (!name || !name.trim()) {
      return;
    }
    setSavedSearches(saveSearch(name.trim(), { ...currentState }));
    toastSuccess("Search saved");
  };

  const handleApplySavedSearch = (saved: SavedSearch) => {
    const payload = saved.payload as SearchState;
    setQuery(payload.query ?? "");
    setGenre(payload.genre ?? "");
    setTag(payload.tag ?? "");
    setDeveloper(payload.developer ?? "");
    setPublisher(payload.publisher ?? "");
    setFranchise(payload.franchise ?? "");
    setMetadataStatus(payload.metadataStatus ?? "");
    setVerificationStatus(payload.verificationStatus ?? "");
    setStorageDevice(payload.storageDevice ?? "");
    toastInfo(`Loaded "${saved.name}"`);
  };

  const handleDeleteSavedSearch = (id: string) => {
    setSavedSearches(deleteSavedSearch(id));
    toastSuccess("Saved search deleted");
  };

  const handleApplyConditions = (conditions: SearchCondition[]) => {
    const setters: Record<SearchField, (value: string) => void> = {
      query: setQuery,
      genre: setGenre,
      tag: setTag,
      developer: setDeveloper,
      publisher: setPublisher,
      franchise: setFranchise,
      storageDevice: setStorageDevice,
      metadataStatus: setMetadataStatus,
      verificationStatus: setVerificationStatus,
    };

    for (const condition of conditions) {
      if (condition.operator === "not-equals") {
        continue;
      }
      setters[condition.field](condition.value);
    }

    setExclusions(
      conditions.filter(
        (condition) => condition.operator === "not-equals" && condition.value,
      ),
    );
    toastInfo(
      `Applied ${conditions.length} condition${
        conditions.length === 1 ? "" : "s"
      }`,
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">Search</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            aria-expanded={showBuilder}
            onClick={() => setShowBuilder((previous) => !previous)}
          >
            <ListFilter size={16} />
            Advanced
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveSearch}>
            <BookmarkPlus size={16} />
            Save search
          </Button>
        </div>
      </div>

      {/* Advanced Search Builder */}
      {showBuilder && (
        <AdvancedSearchBuilder onApply={handleApplyConditions} />
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {savedSearches.map((saved) => (
            <div
              key={saved.id}
              className="flex items-center gap-1 rounded-md border border-border bg-card py-1 pl-1 pr-1.5"
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleApplySavedSearch(saved)}
              >
                {saved.name}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteSavedSearch(saved.id)}
                aria-label={`Delete ${saved.name}`}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="Search archive entries, collections, developers, publishers, tags, and franchises..."
            aria-label="Search archive"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="pl-10 bg-card border-border text-lg py-6"
          />
          <Search
            size={24}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Genre</p>
            <Input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. RPG"
              aria-label="Genre"
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tag</p>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. retro"
              aria-label="Tag"
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Developer</p>
            <Input
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="e.g. Studio Polaris"
              aria-label="Developer"
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Publisher</p>
            <Input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g. Orbit Publishing"
              aria-label="Publisher"
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Franchise</p>
            <Input
              value={franchise}
              onChange={(e) => setFranchise(e.target.value)}
              placeholder="e.g. Skybound Saga"
              aria-label="Franchise"
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Storage Device</p>
            <Input
              value={storageDevice}
              onChange={(e) => setStorageDevice(e.target.value)}
              placeholder="e.g. NAS-01"
              aria-label="Storage device"
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Metadata Status</p>
            <Select
              value={metadataStatus || "ALL"}
              onValueChange={(value) =>
                setMetadataStatus(value === "ALL" ? "" : value)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Metadata Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {METADATA_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Verification Status
            </p>
            <Select
              value={verificationStatus || "ALL"}
              onValueChange={(value) =>
                setVerificationStatus(value === "ALL" ? "" : value)
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {VERIFICATION_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          <p className="mt-4 text-muted-foreground">Searching...</p>
        </div>
      ) : results && results.total > 0 ? (
        <div className="space-y-12">
          {/* Archive Entries */}
          {results.entries.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Archive Entries ({results.entries.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {results.entries.map((entry) => (
                  <ArchiveEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {results.collections.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Collections ({results.collections.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            </section>
          )}

          {/* Developers */}
          {results.developers.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Developers ({results.developers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.developers.map((developer) => (
                  <Link key={developer.id} href={`/developers/${developer.id}`}>
                    <DeveloperCard developer={developer} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Publishers */}
          {results.publishers.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Publishers ({results.publishers.length})
              </h2>
              <div className="space-y-2">
                {results.publishers.map((publisher) => (
                  <Link
                    key={publisher.id}
                    href={`/publishers/${publisher.id}`}
                    className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <p className="font-semibold text-foreground">
                      {publisher.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {results.tags.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Tags ({results.tags.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.tags.map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.id}`}>
                    <TagCard tag={tag} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Franchises */}
          {results.franchises.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Franchises ({results.franchises.length})
              </h2>
              <div className="space-y-2">
                {results.franchises.map((franchise) => (
                  <Link
                    key={franchise.id}
                    href={`/franchises`}
                    className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <p className="font-semibold text-foreground">
                      {franchise.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {franchise.child_ids ? franchise.child_ids.length : 0}{" "}
                      entries
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : query.trim() ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No results found
          </h3>
          <p className="text-muted-foreground">
            Try searching with different keywords
          </p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Start typing to search the archive</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-12">Loading search...</div>}
    >
      <SearchPageContent />
    </Suspense>
  );
}
