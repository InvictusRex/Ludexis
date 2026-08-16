"use client";

import { useMemo } from "react";
import { CheckCircle2, Gauge, XCircle } from "lucide-react";
import type { ArchiveEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QualityCheck {
  label: string;
  weight: number;
  passed: boolean;
  detail: string;
}

export function buildQualityChecks(
  entry: ArchiveEntry,
  screenshotCount = 0,
): QualityCheck[] {
  const confidencePct =
    entry.metadata_confidence != null
      ? Math.round(entry.metadata_confidence * 100)
      : null;

  return [
    {
      label: "Cover art",
      weight: 30,
      passed: Boolean(entry.cover_path),
      detail: entry.cover_path ? "Present" : "Missing",
    },
    {
      label: "Banner art",
      weight: 20,
      passed: Boolean(entry.banner_path),
      detail: entry.banner_path ? "Present" : "Missing",
    },
    {
      label: "Logo art",
      weight: 10,
      passed: Boolean(entry.logo_path),
      detail: entry.logo_path ? "Present" : "Missing",
    },
    {
      label: "Screenshots",
      weight: 10,
      passed: screenshotCount > 0,
      detail:
        screenshotCount > 0
          ? `${screenshotCount} screenshot${screenshotCount === 1 ? "" : "s"}`
          : "None",
    },
    {
      label: "Metadata matched",
      weight: 15,
      passed:
        entry.metadata_status === "MATCHED" ||
        entry.metadata_status === "MANUAL",
      detail: entry.metadata_status,
    },
    {
      label: "High match confidence",
      weight: 10,
      passed: confidencePct != null && confidencePct >= 70,
      detail: confidencePct != null ? `${confidencePct}%` : "Unknown",
    },
    {
      label: "File verified",
      weight: 5,
      passed: entry.verification_status === "VERIFIED",
      detail: entry.verification_status,
    },
  ];
}

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 80) {
    return {
      label: "Excellent",
      className: "bg-green-500/15 text-green-600 border-green-500/30",
    };
  }
  if (score >= 50) {
    return {
      label: "Good",
      className: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    };
  }
  return {
    label: "Needs attention",
    className: "bg-red-500/15 text-red-600 border-red-500/30",
  };
}

export function ArtworkQualityIndicators({
  entry,
  screenshotCount = 0,
}: {
  entry: ArchiveEntry;
  screenshotCount?: number;
}) {
  const { checks, score } = useMemo(() => {
    const built = buildQualityChecks(entry, screenshotCount);
    const earned = built.reduce(
      (sum, check) => sum + (check.passed ? check.weight : 0),
      0,
    );
    const total = built.reduce((sum, check) => sum + check.weight, 0);
    return {
      checks: built,
      score: total === 0 ? 0 : Math.round((earned / total) * 100),
    };
  }, [entry, screenshotCount]);

  const grade = scoreLabel(score);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5" />
          Artwork Quality
        </CardTitle>
        <CardDescription>
          Derived from available artwork, metadata, and verification data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-foreground">{score}</p>
          <div className="flex-1">
            <Progress value={score} />
          </div>
          <Badge variant="outline" className={grade.className}>
            {grade.label}
          </Badge>
        </div>

        <ul className="mt-6 space-y-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                {check.passed ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="w-4 h-4 text-green-600"
                  />
                ) : (
                  <XCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-muted-foreground"
                  />
                )}
                <span
                  className={cn(
                    check.passed ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {check.label}
                </span>
              </span>
              <span className="text-muted-foreground">{check.detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
