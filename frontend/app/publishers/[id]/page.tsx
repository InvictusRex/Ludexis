"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Publisher, ArchiveEntry } from "@/lib/types";
import { publishersApi, archiveApi } from "@/lib/api";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { ArrowLeft, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublisherDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const publisherData = await publishersApi.getById(id);
        setPublisher(publisherData);

        const publisherEntries = await publishersApi.getEntries(id);
        setEntries(publisherEntries);
      } catch (error) {
        console.error("Failed to load publisher:", error);
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

  if (!publisher) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Publisher not found</p>
        <Link href="/publishers">
          <Button variant="outline">Back to Publishers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Link
        href="/publishers"
        className="inline-flex items-center gap-2 text-accent hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Publishers
      </Link>

      {/* Publisher Banner */}
      <div className="relative h-80 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {publisher.artwork?.bannerArt ? (
          <img
            src={publisher.artwork.bannerArt}
            alt={publisher.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-lg">No Banner Art</span>
          </div>
        )}

        {/* Publisher Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end">
          <div className="p-8 w-full">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {publisher.name}
            </h1>
            {publisher.description && (
              <p className="text-muted-foreground max-w-2xl mb-4">
                {publisher.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Publisher Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Published Titles</p>
          <p className="text-2xl font-bold text-accent">{entries.length}</p>
        </div>
        {publisher.country && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Country
            </p>
            <p className="text-lg font-medium text-foreground">
              {publisher.country}
            </p>
          </div>
        )}
        {publisher.website && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Website
            </p>
            <a
              href={publisher.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline truncate"
            >
              Visit Site
            </a>
          </div>
        )}
      </div>

      {/* Published Games */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Games Published
        </h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No published entries found</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
