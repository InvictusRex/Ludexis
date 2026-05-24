"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "@/lib/types";
import { tagsApi } from "@/lib/api";
import { TagCard } from "@/components/common/tag-card";
import { Input } from "@/components/ui/input";
import { Search, Tag as TagIcon } from "lucide-react";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await tagsApi.getAll();
        setTags(data);
        setFilteredTags(data);
      } catch (error) {
        console.error("Failed to load tags:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  // Filter tags
  useEffect(() => {
    let result = [...tags];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    // Featured filter
    if (showFeaturedOnly) {
      result = result.filter((t) => t.isFeatured);
    }

    setFilteredTags(result);
  }, [tags, searchQuery, showFeaturedOnly]);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Tags</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-40 bg-card rounded-lg animate-pulse border border-border"
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Tags</h1>
        <p className="text-muted-foreground">
          {filteredTags.length} of {tags.length} tags
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search Tags
          </label>
          <div className="relative">
            <Input
              type="search"
              placeholder="Search by name or description..."
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

        {/* Featured Filter */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFeaturedOnly}
              onChange={(e) => setShowFeaturedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-muted"
            />
            <span className="text-sm text-foreground">Featured Only</span>
          </label>
        </div>
      </div>

      {/* Tags Grid */}
      {filteredTags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredTags.map((tag) => (
            <Link key={tag.id} href={`/tags/${tag.id}`}>
              <TagCard tag={tag} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <TagIcon className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No tags found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
}
