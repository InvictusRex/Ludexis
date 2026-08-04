"use client";

import { useMemo, useState } from "react";
import { Columns2 } from "lucide-react";
import type { ArchiveEntry, Screenshot } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArtworkOption {
  key: string;
  label: string;
  path: string;
}

export function buildArtworkOptions(
  entry: ArchiveEntry,
  screenshots: Screenshot[] = [],
): ArtworkOption[] {
  const options: ArtworkOption[] = [];
  if (entry.cover_path) {
    options.push({ key: "cover", label: "Cover", path: entry.cover_path });
  }
  if (entry.banner_path) {
    options.push({ key: "banner", label: "Banner", path: entry.banner_path });
  }
  if (entry.logo_path) {
    options.push({ key: "logo", label: "Logo", path: entry.logo_path });
  }
  screenshots.forEach((screenshot, index) => {
    options.push({
      key: `screenshot-${screenshot.id}`,
      label: screenshot.caption || `Screenshot ${index + 1}`,
      path: screenshot.file_path,
    });
  });
  return options;
}

function ArtworkPane({
  option,
  side,
}: {
  option: ArtworkOption | undefined;
  side: string;
}) {
  const [dimensions, setDimensions] = useState<string | null>(null);

  if (!option) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Select artwork to compare
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{option.label}</p>
      <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
        <img
          src={mediaUrl(option.path)}
          alt={`${side}: ${option.label}`}
          className="w-full h-auto"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth > 0 && image.naturalHeight > 0) {
              setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`);
            }
          }}
        />
      </div>
      {dimensions && (
        <p className="text-xs text-muted-foreground">{dimensions}</p>
      )}
    </div>
  );
}

export function ArtworkComparisonDialog({
  entry,
  screenshots = [],
}: {
  entry: ArchiveEntry;
  screenshots?: Screenshot[];
}) {
  const options = useMemo(
    () => buildArtworkOptions(entry, screenshots),
    [entry, screenshots],
  );
  const [leftKey, setLeftKey] = useState<string | undefined>(options[0]?.key);
  const [rightKey, setRightKey] = useState<string | undefined>(
    options[1]?.key ?? options[0]?.key,
  );

  const left = options.find((option) => option.key === leftKey);
  const right = options.find((option) => option.key === rightKey);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border"
          disabled={options.length === 0}
        >
          <Columns2 className="w-4 h-4" />
          Compare Artwork
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Compare Artwork</DialogTitle>
          <DialogDescription>
            View two artwork assets for {entry.title} side-by-side
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="artwork-left">Left</Label>
            <Select value={leftKey} onValueChange={setLeftKey}>
              <SelectTrigger id="artwork-left">
                <SelectValue placeholder="Select artwork" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="artwork-right">Right</Label>
            <Select value={rightKey} onValueChange={setRightKey}>
              <SelectTrigger id="artwork-right">
                <SelectValue placeholder="Select artwork" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ArtworkPane option={left} side="Left" />
          <ArtworkPane option={right} side="Right" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
