"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { franchisesApi } from "@/lib/api";
import type { Franchise } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { mediaUrl } from "@/lib/media";
import { toastError, toastSuccess } from "@/lib/toast";
import { Shot } from "@/components/media/art";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FranchiseImageDialogProps {
  franchise: Franchise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: (franchise: Franchise) => void;
}

/** Pick the franchise's card image from its games' art or SteamGridDB, upload one, or go back to the automatic pick. */
export function FranchiseImageDialog({ franchise, open, onOpenChange, onChanged }: FranchiseImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Franchise image</DialogTitle>
          <DialogDescription>
            Without a chosen image, {franchise.name} shows the banner of its first released game.
          </DialogDescription>
        </DialogHeader>
        {/* Content unmounts on close, so candidates are looked up again on every open. */}
        <ImagePicker franchise={franchise} onChanged={onChanged} />
      </DialogContent>
    </Dialog>
  );
}

function ImagePicker({ franchise, onChanged }: Pick<FranchiseImageDialogProps, "franchise" | "onChanged">) {
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const candidates = useApi(() => franchisesApi.imageCandidates(franchise.id), [franchise.id]);

  const run = async (action: () => Promise<Franchise>, done: string, failed: string) => {
    setBusy(true);
    try {
      onChanged(await action());
      toastSuccess(done);
    } catch (error) {
      toastError(error, failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <Shot path={franchise.image_path} alt="Current image" className="w-48 bg-stone" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ash">{franchise.banner_path ? "Chosen image" : "Automatic"}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}>
              {busy ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload image
            </Button>
            {franchise.banner_path && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => run(() => franchisesApi.resetImage(franchise.id), "Image reset", "The image could not be reset")}
              >
                <RotateCcw />
                Use automatic
              </Button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            aria-label="Image file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                run(() => franchisesApi.uploadImage(franchise.id, file), "Image uploaded", "The image could not be uploaded");
              }
            }}
          />
        </div>
      </div>

      <section aria-label="Images to choose from">
        <h3 className="mb-2 text-sm font-medium text-parchment">Choose an image</h3>
        {candidates.loading ? (
          <p className="flex items-center gap-2 py-2 text-sm text-ash">
            <Loader2 className="size-4 animate-spin" /> Looking through its games and SteamGridDB…
          </p>
        ) : !candidates.data?.length ? (
          <p className="py-2 text-sm text-ash">
            {candidates.error ? "The images could not be loaded." : "Its games have no banners or screenshots yet. Upload one instead."}
          </p>
        ) : (
          <ul className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {candidates.data.map((source) => {
              const online = /^https?:\/\//.test(source);
              return (
                <li key={source}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => franchisesApi.chooseImage(franchise.id, source), "Image updated", "The image could not be set")}
                    aria-label={online ? "Use this image from SteamGridDB" : "Use this image from one of its games"}
                    className="relative block aspect-video w-full overflow-hidden rounded-md bg-stone outline-none transition hover:ring-2 hover:ring-violet-lit focus-visible:ring-2 focus-visible:ring-violet-lit disabled:opacity-50"
                  >
                    <img
                      src={mediaUrl(source)}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 size-full object-cover object-center"
                    />
                    {online && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-night/80 px-1 py-0.5 text-[10px] font-medium text-parchment">
                        SteamGridDB
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
