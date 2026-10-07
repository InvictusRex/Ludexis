"use client";

import { useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { artworkApi } from "@/lib/api";
import type { Screenshot } from "@/lib/types";
import { toastError, toastSuccess } from "@/lib/toast";
import { Shot } from "@/components/media/art";
import { ConfirmDialog } from "@/components/library/confirm-dialog";
import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";

interface ScreenshotGalleryProps {
  entryId: string;
  /** The game's title, for alt text. */
  title: string;
  screenshots: Screenshot[];
  /** Shows upload and delete. */
  canEdit?: boolean;
  /** Called after an upload or delete so the owner can reload the list. */
  onChanged: () => void;
}

const SWIPE_DISTANCE = 50;

export function ScreenshotGallery({ entryId, title, screenshots, canEdit, onChanged }: ScreenshotGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<Screenshot | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const touchStart = useRef<number | null>(null);

  const count = screenshots.length;
  const alt = (index: number) => screenshots[index]?.caption || `${title}, screenshot ${index + 1}`;
  const step = (direction: 1 | -1) => setOpen((index) => (index === null ? null : (index + direction + count) % count));

  const upload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      await artworkApi.upload({ archive_entry_id: entryId, artwork_type: "screenshot", file });
      toastSuccess("Screenshot added");
      onChanged();
    } catch (error) {
      toastError(error, "The screenshot could not be uploaded");
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await artworkApi.remove(deleting.id, "screenshot");
      toastSuccess("Screenshot deleted");
      onChanged();
    } catch (error) {
      toastError(error, "The screenshot could not be deleted");
    }
  };

  return (
    <div>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Add screenshot
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            aria-label="Screenshot file"
            className="hidden"
            onChange={(event) => {
              upload(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {count === 0 ? (
        <p className="py-6 text-sm text-ash">No screenshots yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {screenshots.map((screenshot, index) => (
            <li key={screenshot.id} className="group relative">
              <button
                type="button"
                onClick={() => setOpen(index)}
                aria-label={`Open ${alt(index)}`}
                className="block w-full rounded-md outline-none transition-shadow hover:shadow-[0_0_0_1px_var(--violet-lit)] focus-visible:shadow-[0_0_0_2px_var(--violet-lit)]"
              >
                <Shot path={screenshot.file_path} alt={alt(index)} />
              </button>
              {screenshot.caption && <p className="mt-1.5 truncate text-xs text-ash">{screenshot.caption}</p>}
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Delete ${alt(index)}`}
                  onClick={() => setDeleting(screenshot)}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-night/80 text-parchment opacity-0 backdrop-blur outline-none transition-opacity hover:text-ember focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <DialogPrimitive.Root open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogPortal>
          <DialogOverlay className="bg-night/95" />
          {open !== null && (
            <DialogPrimitive.Content
              aria-describedby={undefined}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") step(1);
                if (event.key === "ArrowLeft") step(-1);
              }}
              onTouchStart={(event) => {
                touchStart.current = event.touches[0].clientX;
              }}
              onTouchEnd={(event) => {
                const delta = event.changedTouches[0].clientX - (touchStart.current ?? 0);
                if (Math.abs(delta) > SWIPE_DISTANCE) step(delta < 0 ? 1 : -1);
              }}
              className="fixed inset-0 z-50 flex flex-col outline-none"
            >
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <DialogPrimitive.Title className="min-w-0 truncate text-sm text-ash">
                  <span className="tabular">
                    {open + 1} / {count}
                  </span>
                  <span className="ml-3 text-parchment">{alt(open)}</span>
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Close"
                  className="grid size-10 place-items-center rounded-full text-parchment outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-5" />
                </DialogPrimitive.Close>
              </div>
              <div className="relative min-h-0 flex-1 px-2 pb-6 sm:px-16">
                {/* Contained and centred: the whole screenshot, never cropped. */}
                <Shot
                  key={screenshots[open].id}
                  path={screenshots[open].file_path}
                  alt={alt(open)}
                  loading="eager"
                  className="aspect-auto size-full rounded-none bg-transparent [&_img]:object-contain"
                />
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous screenshot"
                      onClick={() => step(-1)}
                      className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-night/70 text-parchment outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-ring sm:left-4"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next screenshot"
                      onClick={() => step(1)}
                      className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-night/70 text-parchment outline-none hover:bg-stone focus-visible:ring-2 focus-visible:ring-ring sm:right-4"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
              </div>
            </DialogPrimitive.Content>
          )}
        </DialogPortal>
      </DialogPrimitive.Root>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete this screenshot?"
        description="The image file is removed from the server."
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </div>
  );
}
