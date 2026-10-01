"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag, ArchiveEntry } from "@/lib/types";
import { tagsApi, archiveApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import {
  TAXONOMY_FIELDS,
  TaxonomyFormDialog,
} from "@/components/common/taxonomy-form-dialog";
import { toastError, toastSuccess } from "@/lib/toast";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TagDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [tag, setTag] = useState<Tag | null>(null);
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [relatedTags, setRelatedTags] = useState<Tag[]>([]);
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
        const tagData = await tagsApi.getById(id);
        setTag(tagData);

        const tagEntries = await tagsApi.getEntries(id);
        setEntries(tagEntries);

        const relatedTagsData = await tagsApi.getRelatedTags(id);
        setRelatedTags(relatedTagsData);
      } catch (error) {
        console.error("Failed to load tag:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, authLoading, user]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-64 bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Tag not found</p>
        <Link href="/tags">
          <Button variant="outline">Back to Tags</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) {
      return;
    }
    try {
      await tagsApi.delete(id);
      toastSuccess("Tag deleted");
      router.push("/tags");
    } catch (error) {
      toastError(error, "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/tags"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tags
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
        title="Edit Tag"
        description={`Update details for ${tag.name}`}
        fields={TAXONOMY_FIELDS.tags}
        initial={tag}
        onSubmit={async (values) => {
          setTag(await tagsApi.update(id, values));
          toastSuccess("Tag updated");
        }}
      />

      {/* Tag Header */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start gap-6">
          {/* cover art not provided by backend */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{tag.name}</h1>
              {tag.color && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: tag.color }}
                  title={tag.color}
                />
              )}
            </div>
            {tag.description && (
              <p className="text-muted-foreground mb-4">{tag.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total Entries</p>
                <p className="text-lg font-semibold text-accent">
                  {entries.length}
                </p>
              </div>
              {/* isFeatured not provided by backend */}
            </div>
          </div>
        </div>
      </div>

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Related Tags
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedTags.map((relatedTag) => (
              <Link
                key={relatedTag.id}
                href={`/tags/${relatedTag.id}`}
                className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:border-accent transition-colors"
              >
                {relatedTag.name}
                <span className="text-muted-foreground ml-2 text-xs">
                  {relatedTag.entry_count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Archive Entries
        </h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No entries with this tag</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
