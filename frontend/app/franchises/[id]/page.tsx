"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Franchise, ArchiveEntry } from "@/lib/types";
import { franchisesApi, archiveApi } from "@/lib/api";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FranchiseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const franchiseData = await franchisesApi.getById(id);
        setFranchise(franchiseData);

        const franchiseEntries = await franchisesApi.getEntries(id);
        setEntries(franchiseEntries);
      } catch (error) {
        console.error("Failed to load franchise:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-96 bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Franchise not found</p>
        <Link href="/franchises">
          <Button variant="outline">Back to Franchises</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Link
        href="/franchises"
        className="inline-flex items-center gap-2 text-accent hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Franchises
      </Link>

      {/* Franchise Banner */}
      <div className="relative h-80 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {franchise.artwork?.bannerArt ? (
          <img
            src={franchise.artwork.bannerArt}
            alt={franchise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-lg">No Banner Art</span>
          </div>
        )}

        {/* Franchise Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end">
          <div className="p-8 w-full">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {franchise.name}
            </h1>
            {franchise.description && (
              <p className="text-muted-foreground max-w-2xl mb-4">
                {franchise.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Franchise Info */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Total Entries</p>
            <p className="text-3xl font-bold text-accent">{entries.length}</p>
          </div>
          {franchise.chronologyInfo && franchise.chronologyInfo.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Timeline Structure
              </p>
              <p className="text-foreground">
                {franchise.chronologyInfo.length} episodes/seasons organized
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline View */}
      {entries.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Franchise Timeline
          </h2>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Link key={entry.id} href={`/archive/${entry.id}`}>
                <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-accent transition-colors cursor-pointer group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-semibold text-sm">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {entry.releaseDate
                        ? new Date(entry.releaseDate).getFullYear()
                        : "Date Unknown"}
                    </p>
                  </div>
                  {entry.status && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {entry.status}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">All Entries</h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              No entries in this franchise
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
