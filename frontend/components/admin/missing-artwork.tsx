"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, ImagePlus } from "lucide-react";
import { archiveApi, artworkApi } from "@/lib/api";
import type { ArchiveEntry, ArtworkType } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { plural } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/brand/empty-state";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";
import { ArtworkManagementDialog } from "@/components/common/artwork-management-dialog";

const TYPE_LABELS: Record<ArtworkType, string> = {
  cover: "Cover",
  banner: "Banner",
  logo: "Logo",
  screenshot: "Screenshots",
};

export function MissingArtwork() {
  const missing = useApi(() => artworkApi.getMissing(), []);
  const [downloading, setDownloading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [managing, setManaging] = useState<ArchiveEntry | null>(null);

  const download = async () => {
    setDownloading(true);
    try {
      await artworkApi.autoDownload();
      toastSuccess("Downloading missing artwork in the background");
      announceJobsChanged();
    } catch (error) {
      toastError(error, "Could not start the artwork download");
    } finally {
      setDownloading(false);
    }
  };

  // The missing list has no artwork paths, so the dialog gets the full game first.
  const manage = async (id: string) => {
    setOpeningId(id);
    try {
      setManaging(await archiveApi.getById(id));
    } catch (error) {
      toastError(error, "Could not open the game");
    } finally {
      setOpeningId(null);
    }
  };

  if (missing.error) {
    return (
      <EmptyState
        title="Missing artwork could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={missing.reload}>Try again</Button>}
      />
    );
  }

  if (!missing.data) {
    return (
      <Card className="gap-3 px-5">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-12 w-full" />
        ))}
      </Card>
    );
  }

  if (missing.data.length === 0) {
    return (
      <EmptyState
        title="No artwork is missing"
        description="Every game has its cover, banner, logo and screenshots."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ash">
          {plural(missing.data.length, "game")} with missing artwork. Download fetches it from each game&apos;s
          metadata source.
        </p>
        <Button onClick={download} disabled={downloading}>
          <Download />
          Download missing artwork
        </Button>
      </div>

      <Card className="gap-0 py-0">
        <ul className="divide-y divide-seam">
          {missing.data.map((item) => (
            <li key={item.archive_entry_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <Link href={`/archive/${item.archive_entry_id}`} className="font-medium text-parchment hover:text-violet-lit">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-xs text-ash">
                  Missing {item.missing_types.map((type) => TYPE_LABELS[type] ?? type).join(", ").toLowerCase()}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={openingId !== null}
                onClick={() => manage(item.archive_entry_id)}
              >
                <ImagePlus />
                Manage artwork
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      {managing && (
        <ArtworkManagementDialog
          entry={managing}
          open
          onOpenChange={(open) => {
            if (!open) {
              setManaging(null);
              missing.reload();
            }
          }}
        />
      )}
    </div>
  );
}
