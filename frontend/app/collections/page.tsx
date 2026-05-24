"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Collection } from "@/lib/types";
import { collectionsApi } from "@/lib/api";
import { CollectionCard } from "@/components/common/collection-card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await collectionsApi.getAll();
        setCollections(data);
        setFilteredCollections(data);
      } catch (error) {
        console.error("Failed to load collections:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, []);

  // Filter collections
  useEffect(() => {
    let result = [...collections];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }

    // Visibility filter
    if (showPublicOnly) {
      result = result.filter((c) => c.visibility === "public");
    }

    setFilteredCollections(result);
  }, [collections, searchQuery, showPublicOnly]);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Collections</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-80 bg-card rounded-lg animate-pulse border border-border"
              />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Collections
          </h1>
          <p className="text-muted-foreground">
            {filteredCollections.length} of {collections.length} collections
          </p>
        </div>
        <Button>
          <Plus size={18} />
          New Collection
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search
          </label>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search collections..."
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

        {/* Visibility Filter */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-muted"
            />
            <span className="text-sm text-foreground">Public Only</span>
          </label>
        </div>
      </div>

      {/* Collections Grid */}
      {filteredCollections.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredCollections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Plus className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No collections found
          </h3>
          <p className="text-muted-foreground mb-4">
            Create a new collection to organize your archive entries
          </p>
          <Button>
            <Plus size={18} />
            Create Collection
          </Button>
        </div>
      )}
    </div>
  );
}
