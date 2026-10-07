"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { collectionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { can } from "@/lib/permissions";
import { EmptyState } from "@/components/brand/empty-state";
import { CollectionCard, CollectionCardSkeleton } from "@/components/browse/collection-card";
import { CollectionDialog } from "@/components/browse/collection-dialog";
import { fetchAll } from "@/components/browse/taxonomy-config";
import { Page, PageHeader } from "@/components/shell/page";
import { Button } from "@/components/ui/button";

const GRID = "grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3";

export default function CollectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const list = useApi(() => fetchAll((offset, limit) => collectionsApi.getAll(offset, limit)), []);
  const collections = useMemo(
    () => [...(list.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [list.data],
  );

  const canManage = can(user, "MANAGE_COLLECTIONS");
  const createButton = canManage && (
    <Button onClick={() => setCreating(true)}>
      <Plus />
      Create a collection
    </Button>
  );

  let content: React.ReactNode;
  if (list.error) {
    content = (
      <EmptyState
        title="Couldn't load collections"
        description="The server didn't answer. Check that it's running, then try again."
        action={<Button onClick={list.reload}>Try again</Button>}
      />
    );
  } else if (!list.data) {
    content = (
      <div className={GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <CollectionCardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (collections.length === 0) {
    content = (
      <EmptyState
        title="No collections yet"
        description="Collections keep games together: a series, a backlog, the ones you always come back to."
        action={createButton}
      />
    );
  } else {
    content = (
      <div className={GRID}>
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Collections"
        description={collections.length > 0 ? plural(collections.length, "collection") : undefined}
        actions={collections.length > 0 ? createButton : undefined}
      />
      {content}
      <CollectionDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={(collection) => router.push(`/collections/${collection.id}`)}
      />
    </Page>
  );
}
