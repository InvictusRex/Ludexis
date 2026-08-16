"use client";

import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { archiveApi, artworkApi } from "@/lib/api";
import type { ArchiveEntry, ArtworkType } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ENTRY_ARTWORK_TYPES: ArtworkType[] = ["cover", "banner", "logo"];

const TYPE_META: Record<ArtworkType, string> = {
  cover: "Cover",
  banner: "Banner",
  logo: "Logo",
  screenshot: "Screenshot",
};

function entryPath(entry: ArchiveEntry, type: ArtworkType): string | undefined {
  switch (type) {
    case "cover":
      return entry.cover_path;
    case "banner":
      return entry.banner_path;
    case "logo":
      return entry.logo_path;
    default:
      return undefined;
  }
}

interface ArtworkManagementDialogProps {
  entry: ArchiveEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArtworkManagementDialog({
  entry,
  open,
  onOpenChange,
}: ArtworkManagementDialogProps) {
  const [current, setCurrent] = useState<ArchiveEntry>(entry);
  const [busy, setBusy] = useState<ArtworkType | null>(null);
  const fileInputs = useRef<Record<ArtworkType, HTMLInputElement | null>>({
    cover: null,
    banner: null,
    logo: null,
    screenshot: null,
  });

  useEffect(() => {
    if (open) {
      setCurrent(entry);
      setBusy(null);
    }
  }, [open, entry]);

  const refreshEntry = async () => {
    try {
      const refreshed = await archiveApi.getById(entry.id);
      setCurrent(refreshed);
    } catch (error) {
      toastError(error, "Failed to refresh artwork");
    }
  };

  const handleUpload = async (type: ArtworkType, file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(type);
    try {
      await artworkApi.upload({
        archive_entry_id: entry.id,
        artwork_type: type,
        file,
      });
      toastSuccess(`${TYPE_META[type]} uploaded`);
      await refreshEntry();
    } catch (error) {
      toastError(error, `Failed to upload ${TYPE_META[type].toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const handleReplace = async (type: ArtworkType, file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(type);
    try {
      await artworkApi.replace({
        archive_entry_id: entry.id,
        artwork_type: type,
        file,
      });
      toastSuccess(`${TYPE_META[type]} replaced`);
      await refreshEntry();
    } catch (error) {
      toastError(error, `Failed to replace ${TYPE_META[type].toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (type: ArtworkType) => {
    setBusy(type);
    try {
      await artworkApi.remove(entry.id, type);
      toastSuccess(`${TYPE_META[type]} deleted`);
      await refreshEntry();
    } catch (error) {
      toastError(error, `Failed to delete ${TYPE_META[type].toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const handleFileSelected = (type: ArtworkType, file: File | null) => {
    if (entryPath(current, type)) {
      handleReplace(type, file);
    } else {
      handleUpload(type, file);
    }
  };

  const triggerFile = (type: ArtworkType) => {
    fileInputs.current[type]?.click();
  };

  const renderFileInput = (type: ArtworkType) => (
    <input
      ref={(el) => {
        fileInputs.current[type] = el;
      }}
      type="file"
      accept="image/*"
      aria-label={`${TYPE_META[type]} file`}
      className="hidden"
      disabled={busy !== null}
      onChange={(e) => {
        handleFileSelected(type, e.target.files?.[0] ?? null);
        e.target.value = "";
      }}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Artwork</DialogTitle>
          <DialogDescription>
            Upload, replace, or delete artwork for {current.title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {ENTRY_ARTWORK_TYPES.map((type) => {
            const path = entryPath(current, type);
            return (
              <div
                key={type}
                className="flex items-center gap-4 rounded-md border border-border p-3"
              >
                {path ? (
                  <>
                    <img
                      src={mediaUrl(path)}
                      alt={`${TYPE_META[type]} preview`}
                      className="h-16 w-24 rounded-md border border-border object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {TYPE_META[type]}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Replace ${TYPE_META[type].toLowerCase()}`}
                          className="gap-2 border-border"
                          disabled={busy !== null}
                          onClick={() => triggerFile(type)}
                        >
                          {busy === type ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          aria-label={`Delete ${TYPE_META[type].toLowerCase()}`}
                          className="gap-2"
                          disabled={busy !== null}
                          onClick={() => handleDelete(type)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {TYPE_META[type]}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-border"
                        disabled={busy !== null}
                        onClick={() => triggerFile(type)}
                      >
                        {busy === type ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload {TYPE_META[type]}
                      </Button>
                    </div>
                  </>
                )}
                {renderFileInput(type)}
              </div>
            );
          })}
          <div className="flex items-center gap-4 rounded-md border border-border p-3">
            <div className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-foreground">
                Screenshot
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-border"
                disabled={busy !== null}
                onClick={() => triggerFile("screenshot")}
              >
                {busy === "screenshot" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Screenshot
              </Button>
            </div>
            {renderFileInput("screenshot")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
