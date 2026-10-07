"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { archiveApi } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { useAuth } from "@/contexts/auth-context";
import { useApi } from "@/hooks/use-api";
import { can } from "@/lib/permissions";
import { plural } from "@/lib/format";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { Page } from "@/components/shell/page";
import { EmptyState } from "@/components/brand/empty-state";
import { ArchiveEditDialog } from "@/components/common/archive-edit-dialog";
import { ArtworkManagementDialog } from "@/components/common/artwork-management-dialog";
import { IdentifyDialog } from "@/components/common/identify-dialog";
import { MetadataAuditTrail } from "@/components/common/metadata-audit-trail";
import { ScreenshotGallery } from "@/components/common/screenshot-gallery";
import { VersionList } from "@/components/common/version-list";
import { GameFiles, GameOverview } from "@/components/game/game-details";
import { GameHero } from "@/components/game/game-hero";
import { AddToCollectionDialog } from "@/components/library/add-to-collection-dialog";
import { ConfirmDialog } from "@/components/library/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DialogName = "identify" | "edit" | "artwork" | "collection" | "delete";

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = can(user, "EDIT_METADATA");
  const canCollect = can(user, "MANAGE_COLLECTIONS");

  const game = useApi(() => archiveApi.getById(id), [id]);
  const versions = useApi(() => archiveApi.getVersions(id), [id]);
  const screenshots = useApi(() => archiveApi.getScreenshots(id), [id]);
  const [dialog, setDialog] = useState<DialogName | null>(null);

  const entry = game.data;

  if (game.error) {
    const missing = game.error instanceof ApiError && game.error.status === 404;
    return (
      <Page>
        <EmptyState
          title={missing ? "Game not found" : "This game could not be loaded"}
          description={
            missing ? "It may have been deleted, or the link is wrong." : "Check that the server is running, then try again."
          }
          action={
            missing ? (
              <Button asChild>
                <Link href="/library">Back to the library</Link>
              </Button>
            ) : (
              <Button onClick={game.reload}>Try again</Button>
            )
          }
        />
      </Page>
    );
  }

  if (!entry) {
    return <GameSkeleton />;
  }

  const reloadAll = () => {
    game.reload();
    versions.reload();
    screenshots.reload();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toastSuccess("Link copied");
    } catch (error) {
      toastError(error, "The link could not be copied");
    }
  };

  const openLocation = async () => {
    try {
      const location = await archiveApi.openLocation(entry.id);
      if (location.opened) {
        toastSuccess("Opened in the file manager");
        return;
      }
      // A server without a desktop (a container) cannot open a window; hand over the path instead.
      await navigator.clipboard.writeText(location.path);
      toastInfo("The server has no desktop to open it on, so the path was copied");
    } catch (error) {
      toastError(error, "The location could not be opened");
    }
  };

  const deleteGame = async () => {
    try {
      await archiveApi.delete(entry.id);
      toastSuccess(`${entry.title} deleted`);
      router.push("/library");
    } catch (error) {
      toastError(error, "The game could not be deleted");
    }
  };

  const versionList = versions.data ?? [];
  const shots = screenshots.data ?? [];
  const showShots = shots.length > 0 || canEdit;
  const showHistory = can(user, "VIEW_AUDIT_LOGS");
  const open = (name: DialogName) => () => setDialog(name);
  const setOpen = (name: DialogName) => (next: boolean) => setDialog(next ? name : null);

  return (
    <>
      <GameHero
        entry={entry}
        versionCount={Math.max(versionList.length, entry.version_count ?? 1)}
        canEdit={canEdit}
        onIdentify={open("identify")}
        onEdit={open("edit")}
        onManageArtwork={open("artwork")}
        onAddToCollection={canCollect ? open("collection") : undefined}
        onCopyLink={copyLink}
        onOpenLocation={can(user, "ACCESS_ADMIN") ? openLocation : undefined}
        onDelete={open("delete")}
      />

      <Page className="pt-2">
        <Tabs key={entry.id} defaultValue="overview" className="gap-6">
          <TabsList aria-label="Game sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {showShots && (
              <TabsTrigger value="screenshots">
                Screenshots
                {shots.length > 0 && <span className="text-xs tabular text-ash">{shots.length}</span>}
              </TabsTrigger>
            )}
            {versionList.length > 1 && (
              <TabsTrigger value="versions">
                Versions <span className="text-xs tabular text-ash">{versionList.length}</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="files">Files</TabsTrigger>
            {showHistory && <TabsTrigger value="history">History</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview">
            <GameOverview entry={entry} />
          </TabsContent>
          {showShots && (
            <TabsContent value="screenshots">
              <ScreenshotGallery
                entryId={entry.id}
                title={entry.title}
                screenshots={shots}
                canEdit={canEdit}
                onChanged={screenshots.reload}
              />
            </TabsContent>
          )}
          {versionList.length > 1 && (
            <TabsContent value="versions">
              <p className="mb-4 text-sm text-ash">
                {plural(versionList.length, "version")} of this game are in the library. Identifying one updates them all.
              </p>
              <VersionList versions={versionList} currentId={entry.id} />
            </TabsContent>
          )}
          <TabsContent value="files">
            <GameFiles entry={entry} />
          </TabsContent>
          {showHistory && (
            <TabsContent value="history">
              <MetadataAuditTrail entryId={entry.id} currentUserId={user?.id} />
            </TabsContent>
          )}
        </Tabs>
      </Page>

      {canCollect && (
        <AddToCollectionDialog
          entryIds={[entry.id]}
          open={dialog === "collection"}
          onOpenChange={setOpen("collection")}
          onAdded={() => {
            setDialog(null);
            game.reload();
          }}
        />
      )}
      {canEdit && (
        <>
          <IdentifyDialog entry={entry} open={dialog === "identify"} onOpenChange={setOpen("identify")} onIdentified={reloadAll} />
          <ArchiveEditDialog entry={entry} open={dialog === "edit"} onOpenChange={setOpen("edit")} onSaved={game.setData} />
          <ArtworkManagementDialog
            entry={entry}
            open={dialog === "artwork"}
            onOpenChange={setOpen("artwork")}
            onChanged={(updated) => {
              game.setData(updated);
              screenshots.reload();
            }}
          />
          <ConfirmDialog
            open={dialog === "delete"}
            onOpenChange={setOpen("delete")}
            title={`Delete ${entry.title}?`}
            description="The game is removed from the library. Its files on disk are not touched."
            confirmLabel="Delete game"
            onConfirm={deleteGame}
          />
        </>
      )}
    </>
  );
}

function GameSkeleton() {
  return (
    <div aria-busy="true">
      <div className="-mt-(--topbar-h) flex min-h-[clamp(360px,58vh,660px)] items-end bg-vault px-(--gutter) pb-8 pt-[calc(var(--topbar-h)+2rem)]">
        <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-end lg:gap-10">
          <Skeleton className="aspect-[2/3] w-[136px] shrink-0 sm:w-[184px] lg:w-[232px]" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-12 w-3/4 max-w-lg" />
            <Skeleton className="h-5 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-16 w-full max-w-[70ch]" />
          </div>
        </div>
      </div>
      <Page className="pt-2">
        <Skeleton className="h-11 w-full" />
      </Page>
    </div>
  );
}
