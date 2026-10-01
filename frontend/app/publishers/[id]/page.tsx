"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Publisher, ArchiveEntry } from "@/lib/types";
import { publishersApi, archiveApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import {
  TAXONOMY_FIELDS,
  TaxonomyFormDialog,
} from "@/components/common/taxonomy-form-dialog";
import { toastError, toastSuccess } from "@/lib/toast";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { ArrowLeft, Globe, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublisherDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [publisher, setPublisher] = useState<Publisher | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadData = async () => {
      if (!user) {
        return;
      }

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
  }, [id, authLoading, user]);

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

  const handleDelete = async () => {
    if (!window.confirm(`Delete publisher "${publisher.name}"?`)) {
      return;
    }
    try {
      await publishersApi.delete(id);
      toastSuccess("Publisher deleted");
      router.push("/publishers");
    } catch (error) {
      toastError(error, "Failed to delete publisher");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/publishers"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Publishers
        </Link>
        {user?.is_superuser && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <TaxonomyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Edit Publisher"
        description={`Update details for ${publisher.name}`}
        fields={TAXONOMY_FIELDS.publishers}
        initial={publisher}
        onSubmit={async (values) => {
          setPublisher(await publishersApi.update(id, values));
          toastSuccess("Publisher updated");
        }}
      />

      {/* Publisher Banner */}
      <div className="relative h-80 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-muted-foreground text-lg">No Banner Art</span>
        </div>

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
        {/* country not provided by backend */}
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
