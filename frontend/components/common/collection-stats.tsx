"use client";

import { useMemo } from "react";
import { HardDrive, Image, ShieldCheck, Tags } from "lucide-react";
import type { ArchiveEntry, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const VERIFICATION_ORDER: VerificationStatus[] = [
  "VERIFIED",
  "MISSING",
  "MOVED",
  "CORRUPTED",
  "UNKNOWN",
];

const VERIFICATION_BAR_STYLES: Record<string, string> = {
  VERIFIED: "[&_[data-slot=progress-indicator]]:bg-green-500",
  MISSING: "[&_[data-slot=progress-indicator]]:bg-red-500",
  MOVED: "[&_[data-slot=progress-indicator]]:bg-amber-500",
  CORRUPTED: "[&_[data-slot=progress-indicator]]:bg-rose-500",
  UNKNOWN: "[&_[data-slot=progress-indicator]]:bg-gray-400",
};

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const precision = exponent === 0 ? 0 : value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export function CollectionStats({ entries }: { entries: ArchiveEntry[] }) {
  const stats = useMemo(() => {
    const total = entries.length;
    const totalSize = entries.reduce(
      (sum, entry) => sum + (entry.file_size ?? 0),
      0,
    );
    const byVerification = VERIFICATION_ORDER.reduce<Record<string, number>>(
      (acc, status) => {
        acc[status] = entries.filter(
          (entry) => entry.verification_status === status,
        ).length;
        return acc;
      },
      {},
    );
    const withMetadata = entries.filter(
      (entry) => entry.metadata_status !== "UNMATCHED",
    ).length;
    const withArtwork = entries.filter((entry) => Boolean(entry.cover_path))
      .length;

    return {
      total,
      totalSize,
      byVerification,
      verifiedCount: byVerification.VERIFIED ?? 0,
      metadataCoverage: total === 0 ? 0 : Math.round((withMetadata / total) * 100),
      artworkCoverage: total === 0 ? 0 : Math.round((withArtwork / total) * 100),
      withMetadata,
      withArtwork,
    };
  }, [entries]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Collection Statistics</CardTitle>
        <CardDescription>
          Size, verification, and coverage across collection members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Total Entries
            </p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Total Size
            </p>
            <p className="text-2xl font-bold text-foreground">
              {formatFileSize(stats.totalSize)}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Metadata Coverage
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Progress value={stats.metadataCoverage} className="flex-1" />
              <span className="text-sm font-medium text-foreground w-10 text-right">
                {stats.metadataCoverage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.withMetadata} of {stats.total} matched
            </p>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Image className="w-4 h-4" />
              Artwork Coverage
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Progress value={stats.artworkCoverage} className="flex-1" />
              <span className="text-sm font-medium text-foreground w-10 text-right">
                {stats.artworkCoverage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.withArtwork} of {stats.total} with cover art
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Verification Breakdown
          </p>
          {VERIFICATION_ORDER.map((status) => {
            const count = stats.byVerification[status] ?? 0;
            const percent =
              stats.total === 0
                ? 0
                : Math.round((count / stats.total) * 100);
            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{status}</span>
                  <span className="font-medium text-foreground">
                    {count} · {percent}%
                  </span>
                </div>
                <Progress
                  value={percent}
                  className={cn("h-2", VERIFICATION_BAR_STYLES[status])}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
