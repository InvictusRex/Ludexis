"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, RefreshCw } from "lucide-react";
import { archiveApi, collectionsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { ArchiveEntry, Collection } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";

const MAX_RECOMMENDATIONS = 3;

interface Recommendation {
  collection: Collection;
  score: number;
  sharedTags: number;
  sharedDevelopers: number;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const value of a) {
    if (b.has(value)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function countShared(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const value of a) {
    if (b.has(value)) shared += 1;
  }
  return shared;
}

function collectSets(entries: ArchiveEntry[]) {
  const tags = new Set<string>();
  const developers = new Set<string>();
  for (const entry of entries) {
    for (const tagId of entry.tag_ids ?? []) tags.add(tagId);
    for (const developerId of entry.developer_ids ?? []) {
      developers.add(developerId);
    }
  }
  return { tags, developers };
}

export function CollectionRecommendations({
  collectionId,
  entries,
}: {
  collectionId: string;
  entries: ArchiveEntry[];
}) {
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [allEntries, setAllEntries] = useState<ArchiveEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [collectionList, archiveEntries] = await Promise.all([
        collectionsApi.getAll(0, 100),
        archiveApi.getAll(0, 500),
      ]);
      setCollections(collectionList);
      setAllEntries(archiveEntries);
    } catch (err) {
      toastError(err, "Failed to load recommendations.");
      setError("Failed to load recommendations. Please try again.");
      setCollections([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!collections) return [];
    const current = collectSets(entries);
    if (current.tags.size === 0 && current.developers.size === 0) {
      return [];
    }

    const entriesById = new Map(allEntries.map((entry) => [entry.id, entry]));

    return collections
      .filter((candidate) => candidate.id !== collectionId)
      .map((candidate) => {
        const memberEntries = (candidate.entry_ids ?? [])
          .map((entryId) => entriesById.get(entryId))
          .filter((entry): entry is ArchiveEntry => Boolean(entry));
        const candidateSets = collectSets(memberEntries);
        const tagScore = jaccard(current.tags, candidateSets.tags);
        const developerScore = jaccard(
          current.developers,
          candidateSets.developers,
        );
        return {
          collection: candidate,
          score: tagScore * 0.6 + developerScore * 0.4,
          sharedTags: countShared(current.tags, candidateSets.tags),
          sharedDevelopers: countShared(
            current.developers,
            candidateSets.developers,
          ),
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);
  }, [allEntries, collectionId, collections, entries]);

  const overlapReason = (recommendation: Recommendation): string => {
    const parts: string[] = [];
    if (recommendation.sharedTags > 0) {
      parts.push(
        `Shares ${recommendation.sharedTags} tag${
          recommendation.sharedTags === 1 ? "" : "s"
        }`,
      );
    }
    if (recommendation.sharedDevelopers > 0) {
      parts.push(
        `${recommendation.sharedDevelopers} developer${
          recommendation.sharedDevelopers === 1 ? "" : "s"
        }`,
      );
    }
    return parts.join(" · ");
  };

  const renderBody = () => {
    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={load}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      );
    }
    if (collections === null) {
      return (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    if (recommendations.length === 0) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>No similar collections yet</EmptyTitle>
            <EmptyDescription>
              Recommendations appear once collections share tags or developers.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((recommendation) => (
          <Link
            key={recommendation.collection.id}
            href={`/collections/${recommendation.collection.id}`}
            className="rounded-lg border border-border p-4 space-y-2 hover:border-accent transition-colors"
          >
            <p className="font-medium text-foreground">
              {recommendation.collection.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {overlapReason(recommendation)}
            </p>
            <Badge
              variant="outline"
              className="bg-accent/10 text-accent border-accent/30"
            >
              {Math.round(recommendation.score * 100)}% match
            </Badge>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">You Might Also Like</CardTitle>
        <CardDescription>
          Collections with overlapping tags and developers
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
