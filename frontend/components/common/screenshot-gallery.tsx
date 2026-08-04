"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { archiveApi, artworkApi } from "@/lib/api";
import type { Screenshot } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";

interface ScreenshotGalleryProps {
  entryId: string;
}

export function ScreenshotGallery({ entryId }: ScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScreenshots = async () => {
    try {
      const data = await archiveApi.getScreenshots(entryId);
      setScreenshots(data);
    } catch (error) {
      toastError(error, "Failed to load screenshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScreenshots();
  }, [entryId]);

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      await artworkApi.upload({
        archive_entry_id: entryId,
        artwork_type: "screenshot",
        file,
      });
      toastSuccess("Screenshot uploaded");
      await loadScreenshots();
    } catch (error) {
      toastError(error, "Failed to upload screenshot");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (screenshot: Screenshot) => {
    if (!window.confirm("Delete this screenshot?")) {
      return;
    }
    setBusy(true);
    try {
      await artworkApi.remove(screenshot.id, "screenshot");
      toastSuccess("Screenshot deleted");
      await loadScreenshots();
    } catch (error) {
      toastError(error, "Failed to delete screenshot");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Screenshots</h3>
        <Button
          variant="outline"
          size="sm"
          disabled={busy || loading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} />
          Upload screenshot
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Screenshot file"
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {loading ? (
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      ) : screenshots.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
          No screenshots yet
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {screenshots.map((shot) => (
            <div key={shot.id} className="relative">
              <img
                src={mediaUrl(shot.file_path)}
                alt={shot.caption ?? "Screenshot"}
                className="w-full h-40 object-cover rounded-lg border border-border"
              />
              <Button
                variant="destructive"
                size="icon-sm"
                aria-label="Delete screenshot"
                className="absolute top-2 right-2"
                disabled={busy}
                onClick={() => handleDelete(shot)}
              >
                <Trash2 size={16} />
              </Button>
              {shot.caption && (
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {shot.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
