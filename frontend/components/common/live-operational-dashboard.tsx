"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  RefreshCw,
  Server,
  Waypoints,
} from "lucide-react";
import { healthApi, jobMonitorApi, scansApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import type { HealthStatus, JobMonitorStats, ScanStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  MAX_TREND_SAMPLES,
  TrendVisualization,
  type TrendSample,
} from "@/components/common/trend-visualization";

export const LIVE_POLL_INTERVAL_MS = 10000;

interface LiveSnapshot {
  health: HealthStatus;
  db: HealthStatus;
  redis: HealthStatus;
  jobStats: JobMonitorStats;
  scanStatus: ScanStatus;
}

function isHealthy(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return (
    normalized === "ok" || normalized === "healthy" || normalized === "pong"
  );
}

function healthBadge(healthy: boolean) {
  return healthy ? (
    <Badge className="bg-green-500/15 text-green-600 border-green-500/30">
      healthy
    </Badge>
  ) : (
    <Badge className="bg-red-500/15 text-red-600 border-red-500/30">
      unhealthy
    </Badge>
  );
}

export function LiveOperationalDashboard({
  pollIntervalMs = LIVE_POLL_INTERVAL_MS,
}: {
  pollIntervalMs?: number;
} = {}) {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [samples, setSamples] = useState<TrendSample[]>([]);
  const [live, setLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorNotifiedRef = useRef(false);

  const loadSnapshot = useCallback(async () => {
    try {
      const [health, db, redis, jobStats, scanStatus] = await Promise.all([
        healthApi.getHealth(),
        healthApi.getDb(),
        healthApi.getRedis(),
        jobMonitorApi.getStats(),
        scansApi.getStatus(),
      ]);
      const next: LiveSnapshot = { health, db, redis, jobStats, scanStatus };
      setSnapshot(next);
      setError(null);
      errorNotifiedRef.current = false;
      setLastUpdated(new Date());
      setSamples((previous) => {
        const sample: TrendSample = {
          apiHealthy: isHealthy(health.status),
          dbHealthy: isHealthy(db.database ?? db.status),
          redisHealthy: isHealthy(redis.redis ?? redis.status),
          pendingJobs: scanStatus.pending ?? 0,
          runningJobs: scanStatus.running ?? 0,
          activeTasks: jobStats.active_tasks ?? 0,
        };
        return [...previous, sample].slice(-MAX_TREND_SAMPLES);
      });
    } catch (err) {
      if (!errorNotifiedRef.current) {
        toastError(err, "Failed to load live operational data.");
        errorNotifiedRef.current = true;
      }
      setError("Failed to load live operational data. Please try again.");
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!live) {
      return;
    }
    const intervalId = setInterval(() => {
      loadSnapshot();
    }, pollIntervalMs);

    return () => clearInterval(intervalId);
  }, [live, loadSnapshot, pollIntervalMs]);

  const renderBody = () => {
    if (error && !snapshot) {
      return (
        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      );
    }
    if (!snapshot) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    const apiHealthy = isHealthy(snapshot.health.status);
    const dbHealthy = isHealthy(snapshot.db.database ?? snapshot.db.status);
    const redisHealthy = isHealthy(snapshot.redis.redis ?? snapshot.redis.status);

    return (
      <>
        {error && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Server className="w-4 h-4" />
                API
              </p>
              <p className="font-semibold text-foreground">
                {snapshot.health.status ?? "unknown"}
              </p>
            </div>
            {healthBadge(apiHealthy)}
          </div>
          <div className="rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Database className="w-4 h-4" />
                Database
              </p>
              <p className="font-semibold text-foreground">
                {snapshot.db.database ?? snapshot.db.status ?? "unknown"}
              </p>
            </div>
            {healthBadge(dbHealthy)}
          </div>
          <div className="rounded-lg border border-border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                <Waypoints className="w-4 h-4" />
                Redis
              </p>
              <p className="font-semibold text-foreground">
                {snapshot.redis.redis ?? snapshot.redis.status ?? "unknown"}
              </p>
            </div>
            {healthBadge(redisHealthy)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Workers</p>
            <p className="text-2xl font-bold text-accent">
              {snapshot.jobStats.workers}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Active Tasks</p>
            <p className="text-2xl font-bold text-blue-500">
              {snapshot.jobStats.active_tasks}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending Scans</p>
            <p className="text-2xl font-bold text-amber-500">
              {snapshot.scanStatus.pending}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Running Scans</p>
            <p className="text-2xl font-bold text-green-500">
              {snapshot.scanStatus.running}
            </p>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Live Operational Dashboard
            </CardTitle>
            <CardDescription>
              Real-time service availability and workload
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {live && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                LIVE
              </span>
            )}
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="live-updates"
                checked={live}
                onCheckedChange={setLive}
              />
              <Label htmlFor="live-updates" className="text-sm">
                <RefreshCw className="w-3.5 h-3.5" />
                Live updates
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>{renderBody()}</CardContent>
      </Card>

      <TrendVisualization samples={samples} />
    </div>
  );
}
