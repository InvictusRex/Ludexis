"use client";

import { useEffect, useState } from "react";
import { ArchiveEntry, MetadataStatus, EntryStatus } from "@/lib/types";
import { archiveApi } from "@/lib/api";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortAsc } from "lucide-react";

type SortBy = "title" | "date" | "rating" | "updated";

export default function LibraryPage() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [metadataFilter, setMetadataFilter] = useState<MetadataStatus | "ALL">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("title");

  // Load data
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await archiveApi.getAll();
        setEntries(data);
        setFilteredEntries(data);
      } catch (error) {
        console.error("Failed to load entries:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...entries];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }

    // Metadata status filter
    if (metadataFilter !== "ALL") {
      result = result.filter((e) => e.metadataStatus === metadataFilter);
    }

    // Entry status filter
    if (statusFilter !== "ALL") {
      result = result.filter((e) => e.status === statusFilter);
    }

    // Sorting
    switch (sortBy) {
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "date":
        result.sort(
          (a, b) =>
            new Date(b.releaseDate || 0).getTime() -
            new Date(a.releaseDate || 0).getTime(),
        );
        break;
      case "rating":
        result.sort(
          (a, b) => (b.personalRating || 0) - (a.personalRating || 0),
        );
        break;
      case "updated":
        result.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        break;
    }

    setFilteredEntries(result);
  }, [entries, searchQuery, metadataFilter, statusFilter, sortBy]);

  if (loading) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Library</h1>
        <p className="text-muted-foreground">
          {filteredEntries.length} of {entries.length} entries
        </p>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
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

          {/* Entry Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Play Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as EntryStatus | "ALL")
              }
              className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
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
              <option value="rating">Rating</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {filteredEntries.map((entry) => (
            <ArchiveEntryCard key={entry.id} entry={entry} />
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
    </div>
  );
}
