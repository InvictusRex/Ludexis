"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export interface TrendSample {
  apiHealthy: boolean;
  dbHealthy: boolean;
  redisHealthy: boolean;
  pendingJobs: number;
  runningJobs: number;
  activeTasks: number;
}

export const MAX_TREND_SAMPLES = 60;

const SERIES: Array<{
  key: keyof TrendSample;
  label: string;
  className: string;
  kind: "boolean" | "count";
}> = [
  {
    key: "apiHealthy",
    label: "API Availability",
    className: "stroke-green-500",
    kind: "boolean",
  },
  {
    key: "dbHealthy",
    label: "Database Availability",
    className: "stroke-blue-500",
    kind: "boolean",
  },
  {
    key: "redisHealthy",
    label: "Redis Availability",
    className: "stroke-purple-500",
    kind: "boolean",
  },
  {
    key: "runningJobs",
    label: "Running Jobs",
    className: "stroke-amber-500",
    kind: "count",
  },
  {
    key: "pendingJobs",
    label: "Pending Jobs",
    className: "stroke-orange-500",
    kind: "count",
  },
  {
    key: "activeTasks",
    label: "Active Tasks",
    className: "stroke-cyan-500",
    kind: "count",
  },
];

const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 30;

function seriesValues(samples: TrendSample[], key: keyof TrendSample): number[] {
  return samples.map((sample) => {
    const value = sample[key];
    return typeof value === "boolean" ? (value ? 1 : 0) : value;
  });
}

function buildPoints(values: number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = values.length === 1 ? 0 : VIEW_WIDTH / (values.length - 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? VIEW_WIDTH / 2 : index * step;
      const y = VIEW_HEIGHT - (value / max) * VIEW_HEIGHT;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function TrendVisualization({ samples }: { samples: TrendSample[] }) {
  const series = useMemo(
    () =>
      SERIES.map((entry) => {
        const values = seriesValues(samples, entry.key);
        const latest = values.length > 0 ? values[values.length - 1] : 0;
        const peak = values.length > 0 ? Math.max(...values) : 0;
        return {
          ...entry,
          points: buildPoints(values),
          latest,
          peak,
        };
      }),
    [samples],
  );

  const renderBody = () => {
    if (samples.length < 2) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp className="w-6 h-6" />
            </EmptyMedia>
            <EmptyTitle>Not enough samples yet</EmptyTitle>
            <EmptyDescription>
              Enable live updates to start collecting trend samples.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((entry) => (
            <div key={entry.key} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-foreground">
                  {entry.label}
                </p>
                <span className="text-xs text-muted-foreground">
                  {entry.kind === "boolean"
                    ? entry.latest === 1
                      ? "up"
                      : "down"
                    : entry.latest}
                  {entry.kind === "count" && ` · peak ${entry.peak}`}
                </span>
              </div>
              <svg
                role="img"
                aria-label={`${entry.label} trend`}
                viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                preserveAspectRatio="none"
                className="w-full h-16 rounded-md border border-border bg-muted/30"
              >
                <polyline
                  points={entry.points}
                  fill="none"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  className={entry.className}
                />
              </svg>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>now - {samples.length - 1} ticks</span>
          <span>now</span>
        </div>
      </>
    );
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Trend Visualization</CardTitle>
        <CardDescription>
          Sampled availability and workload over the current session (up to{" "}
          {MAX_TREND_SAMPLES} samples)
        </CardDescription>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
