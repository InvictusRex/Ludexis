"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArchiveEntry,
  Collection,
  MetadataStatus,
  SearchFilters,
  VerificationStatus,
} from "@/lib/types";
import { adminApi, archiveApi, collectionsApi } from "@/lib/api";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { BulkActionBar } from "@/components/common/bulk-action-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";

type SortBy = "title" | "date" | "updated";

const PAGE_SIZE = 100;

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [maxLoadedPage, setMaxLoadedPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const requestRef = useRef(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [metadataFilter, setMetadataFilter] = useState<MetadataStatus | "ALL">(
    "ALL",
  );
  const [verificationFilter, setVerificationFilter] = useState<
    VerificationStatus | "ALL"
  >("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("title");

  const filters: SearchFilters = useMemo(
    () => ({
      metadataStatus: metadataFilter !== "ALL" ? [metadataFilter] : undefined,
      verificationStatus:
        verificationFilter !== "ALL" ? [verificationFilter] : undefined,
    }),
    [metadataFilter, verificationFilter],
  );

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const reqId = ++requestRef.current;
    setPaginationLoading(true);

    const loadPage = async () => {
      setEntries([]);
      setPage(0);
      setMaxLoadedPage(0);
      setHasMore(true);
      try {
        const data = await archiveApi.search(searchQuery, filters, 0, PAGE_SIZE);
        if (reqId !== requestRef.current) {
          return;
        }
        setEntries(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        if (reqId !== requestRef.current) {
          return;
        }
        console.error("Failed to load entries:", err);
        setError(true);
      } finally {
        if (reqId === requestRef.current) {
          setPaginationLoading(false);
          setLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(loadPage, 300);
    return () => clearTimeout(debounceTimer);
  }, [authLoading, user, searchQuery, filters, refreshKey]);

  // Best-effort total count. /admin/stats may require admin access, so fall
  // back to relying on "Load more" if it fails.
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    adminApi
      .getStats()
      .then((stats) => {
        if (!cancelled) {
          setTotalCount(stats.archive_entries);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load library stats:", err);
          setTotalCount(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const reloadEntries = () => {
    setRefreshKey((k) => k + 1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredEntries.length > 0 &&
    filteredEntries.every((e) => selectedIds.has(e.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredEntries.forEach((e) => next.delete(e.id));
      } else {
        filteredEntries.forEach((e) => next.add(e.id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Delete ${ids.length} selected entr${ids.length === 1 ? "y" : "ies"}?`,
      )
    ) {
      return;
    }
    const results = await Promise.allSettled(
      ids.map((id) => archiveApi.delete(id)),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;
    if (failed > 0) {
      toastError(
        new Error(`${failed} of ${results.length} entries could not be deleted`),
        `Deleted ${succeeded} of ${results.length} entries`,
      );
    } else {
      toastSuccess(`Deleted ${succeeded} of ${results.length} entries`);
    }
    clearSelection();
    reloadEntries();
  };

  const openCollectionPicker = async () => {
    setCollectionDialogOpen(true);
    setCollectionsLoading(true);
    try {
      setCollections(await collectionsApi.getAll());
    } catch (error) {
      toastError(error, "Failed to load collections");
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }
    setBulkAdding(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => collectionsApi.addEntry(collectionId, id)),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      if (failed > 0) {
        toastError(
          new Error(`${failed} of ${results.length} entries could not be added`),
          `Added ${succeeded} of ${results.length} entries`,
        );
      } else {
        toastSuccess(
          `Added ${succeeded} of ${results.length} entr${
            results.length === 1 ? "y" : "ies"
          } to collection`,
        );
      }
      clearSelection();
      setCollectionDialogOpen(false);
    } catch (error) {
      toastError(error, "Failed to add entries to collection");
    } finally {
      setBulkAdding(false);
    }
  };

  const loadNextPage = async (offset: number) => {
    if (paginationLoading) {
      return;
    }

    const reqId = ++requestRef.current;
    setPaginationLoading(true);

    try {
      const data = await archiveApi.search(searchQuery, filters, offset, PAGE_SIZE);
      if (reqId !== requestRef.current) {
        return;
      }
      setHasMore(data.length === PAGE_SIZE);
      setEntries((prev) => [...prev, ...data]);
      setMaxLoadedPage(Math.ceil((offset + data.length) / PAGE_SIZE) - 1);
      setPage(Math.ceil((offset + data.length) / PAGE_SIZE) - 1);
    } catch (err) {
      if (reqId !== requestRef.current) {
        return;
      }
      console.error("Failed to load more entries:", err);
    } finally {
      if (reqId === requestRef.current) {
        setPaginationLoading(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !paginationLoading) {
      loadNextPage(entries.length);
    }
  };

  const handleNext = () => {
    if (page < maxLoadedPage) {
      setPage((p) => p + 1);
    } else if (hasMore && !paginationLoading) {
      loadNextPage(entries.length);
    }
  };

  const handlePrev = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  // Entries currently visible for the active page window (pages 0..page).
  const visibleEntries = useMemo(
    () => entries.slice(0, (page + 1) * PAGE_SIZE),
    [entries, page],
  );

  useEffect(() => {
    const result = [...visibleEntries];

    switch (sortBy) {
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        result.sort(
          (a, b) =>
            new Date(b.release_date || 0).getTime() -
            new Date(a.release_date || 0).getTime(),
        );
        break;
      case "updated":
        result.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
        break;
    }

    setFilteredEntries(result);
  }, [visibleEntries, sortBy]);

  const rangeStart = visibleEntries.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd =
    totalCount != null
      ? Math.min(visibleEntries.length, totalCount)
      : visibleEntries.length;

  if (authLoading || loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Library</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-96 bg-card rounded-lg animate-pulse border border-border"
              />
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Library</h1>
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Filter className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Failed to load library
          </h3>
          <p className="text-muted-foreground">
            There was an error fetching archive entries. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Library</h1>
        <p className="text-muted-foreground">
          {totalCount != null
            ? `Showing ${rangeStart}–${rangeEnd} of ${totalCount} entries`
            : `Showing ${rangeStart}–${rangeEnd} entries`}
        </p>
        <p className="text-muted-foreground text-sm">
          {filteredEntries.length} of {visibleEntries.length} shown ·{" "}
          {entries.length} loaded
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        {/* Bulk selection */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allFilteredSelected}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all entries"
          />
          <span className="text-sm font-medium text-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : "Select all"}
          </span>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search
          </label>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Metadata Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Metadata Status
            </label>
            <select
              value={metadataFilter}
              onChange={(e) =>
                setMetadataFilter(e.target.value as MetadataStatus | "ALL")
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="MATCHED">Matched</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNMATCHED">Unmatched</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Verification Status
            </label>
            <select
              value={verificationFilter}
              onChange={(e) =>
                setVerificationFilter(
                  e.target.value as VerificationStatus | "ALL",
                )
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="MISSING">Missing</option>
              <option value="MOVED">Moved</option>
              <option value="CORRUPTED">Corrupted</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            >
              <option value="title">Title (A-Z)</option>
              <option value="date">Release Date</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onAddToCollection={openCollectionPicker}
        onClear={clearSelection}
      />

      {/* Results Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "relative",
                selectedIds.has(entry.id) && "ring-2 ring-primary rounded-lg",
              )}
            >
              <ArchiveEntryCard entry={entry} />
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  aria-label={`Select ${entry.title}`}
                  checked={selectedIds.has(entry.id)}
                  onCheckedChange={() => toggleSelect(entry.id)}
                  className="bg-background"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Filter className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No entries found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Button
          variant="outline"
          disabled={page === 0 || paginationLoading}
          onClick={handlePrev}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">Page {page + 1}</span>

        {hasMore && (
          <Button
            variant="outline"
            disabled={paginationLoading}
            onClick={handleLoadMore}
          >
            {paginationLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        )}

        <Button
          variant="outline"
          disabled={(!hasMore && page >= maxLoadedPage) || paginationLoading}
          onClick={handleNext}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Collection Picker */}
      <Dialog
        open={collectionDialogOpen}
        onOpenChange={setCollectionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to collection</DialogTitle>
            <DialogDescription>
              Choose a collection for {selectedIds.size} selected entr
              {selectedIds.size === 1 ? "y" : "ies"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {collectionsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading collections...
              </p>
            ) : collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No collections available.
              </p>
            ) : (
              collections.map((collection) => (
                <Button
                  key={collection.id}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={bulkAdding}
                  onClick={() => handleAddToCollection(collection.id)}
                >
                  {collection.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
