"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Developer, ArchiveEntry } from "@/lib/types";
import { developersApi, archiveApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import {
  TAXONOMY_FIELDS,
  TaxonomyFormDialog,
} from "@/components/common/taxonomy-form-dialog";
import { toastError, toastSuccess } from "@/lib/toast";
import { ArchiveEntryCard } from "@/components/common/archive-entry-card";
import { ArrowLeft, Globe, MapPin, Calendar, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DeveloperDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [developer, setDeveloper] = useState<Developer | null>(null);
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
        const developerData = await developersApi.getById(id);
        setDeveloper(developerData);

        const developerEntries = await developersApi.getEntries(id);
        setEntries(developerEntries);
      } catch (error) {
        console.error("Failed to load developer:", error);
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

  if (!developer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Developer not found</p>
        <Link href="/developers">
          <Button variant="outline">Back to Developers</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete developer "${developer.name}"?`)) {
      return;
    }
    try {
      await developersApi.delete(id);
      toastSuccess("Developer deleted");
      router.push("/developers");
    } catch (error) {
      toastError(error, "Failed to delete developer");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/developers"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Developers
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
        title="Edit Developer"
        description={`Update details for ${developer.name}`}
        fields={TAXONOMY_FIELDS.developers}
        initial={developer}
        onSubmit={async (values) => {
          setDeveloper(await developersApi.update(id, values));
          toastSuccess("Developer updated");
        }}
      />

      {/* Developer Header */}
      <div className="p-2">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {developer.name}
        </h1>
        {developer.description && (
          <p className="text-muted-foreground max-w-2xl mb-4">
            {developer.description}
          </p>
        )}
      </div>

      {/* Developer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Archive Entries</p>
          <p className="text-2xl font-bold text-accent">{entries.length}</p>
        </div>
        {/* country and foundedDate not provided by backend; omitted */}
        {developer.website && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Website
            </p>
            <a
              href={developer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline truncate"
            >
              Visit Site
            </a>
          </div>
        )}
      </div>

      {/* Archive Entries */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Games by {developer.name}
        </h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              No entries from this developer
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
