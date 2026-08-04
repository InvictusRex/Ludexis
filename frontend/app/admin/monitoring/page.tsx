"use client";

import { useCallback, useEffect, useState } from "react";
import {
  healthApi,
  jobMonitorApi,
  scansApi,
  adminApi,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAdmin } from "@/hooks/use-protected-route";
import { config } from "@/lib/config";
import type {
  HealthStatus,
  JobMonitorStats,
  JobMonitorWorker,
  ScanStatus,
  AdminStats,
} from "@/lib/types";
import {
  Activity,
  AlertTriangle,
  Database,
  ExternalLink,
  LineChart,
  Loader2,
  RefreshCw,
  Server,
  Users,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PrometheusMetricsPanel } from "@/components/common/prometheus-metrics-panel";
import { LiveOperationalDashboard } from "@/components/common/live-operational-dashboard";

interface MonitoringData {
  health: HealthStatus;
  db: HealthStatus;
  redis: HealthStatus;
  jobStats: JobMonitorStats;
  workers: JobMonitorWorker;
  scanStatus: ScanStatus;
  adminStats: AdminStats;
}

function isHealthy(value: string | undefined): boolean {
  return typeof value === "string" && value.toLowerCase() === "ok";
}

function serviceBadge(status: string | undefined) {
  const value = status?.trim().toLowerCase();
  if (!value) {
    return <Badge className="bg-gray-500/15 text-gray-600 border-gray-500/30">unknown</Badge>;
  }
  if (value === "ok" || value === "healthy" || value === "pong") {
    return <Badge className="bg-green-500/15 text-green-600 border-green-500/30">healthy</Badge>;
  }
  return <Badge className="bg-red-500/15 text-red-600 border-red-500/30">unhealthy</Badge>;
}

const SCAN_SEGMENTS: Array<{
  key: keyof ScanStatus;
  label: string;
  className: string;
}> = [
  { key: "pending", label: "Pending", className: "bg-amber-500" },
  { key: "running", label: "Running", className: "bg-blue-500" },
  { key: "success", label: "Success", className: "bg-green-500" },
  { key: "failed", label: "Failed", className: "bg-red-500" },
  { key: "canceled", label: "Canceled", className: "bg-gray-500" },
];

export default function AdminMonitoring() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  useRequireAdmin(user, authLoading);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, db, redis, jobStats, workers, scanStatus, adminStats] =
        await Promise.all([
          healthApi.getHealth(),
          healthApi.getDb(),
          healthApi.getRedis(),
          jobMonitorApi.getStats(),
          jobMonitorApi.getWorkers(),
          scansApi.getStatus(),
          adminApi.getStats(),
        ]);
      setData({ health, db, redis, jobStats, workers, scanStatus, adminStats });
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
      setError("Failed to load monitoring data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [authLoading, loadData]);

  const workerEntries = data ? Object.entries(data.workers) : [];

  const scanTotal = data?.scanStatus.total ?? 0;
  const scanSegments = data
    ? SCAN_SEGMENTS.map((segment) => ({
        ...segment,
        value: data.scanStatus[segment.key] ?? 0,
        pct: scanTotal > 0 ? ((data.scanStatus[segment.key] ?? 0) / scanTotal) * 100 : 0,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            System Monitoring
          </h1>
          <p className="text-muted-foreground">
            Live health, worker, scan, and archive observability
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-border"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading monitoring data...
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit border-border"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Infrastructure */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Infrastructure
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      API
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {data.health.status ?? "unknown"}
                    </p>
                  </div>
                  {serviceBadge(data.health.status)}
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Database
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {data.db.database ?? data.db.status ?? "unknown"}
                    </p>
                  </div>
                  {serviceBadge(data.db.database ?? data.db.status)}
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                      <Waypoints className="w-4 h-4" />
                      Redis
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {data.redis.redis ?? data.redis.status ?? "unknown"}
                    </p>
                  </div>
                  {serviceBadge(data.redis.redis ?? data.redis.status)}
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                      <LineChart className="w-4 h-4" />
                      Grafana
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      Docker instance
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-border"
                  >
                    <a
                      href={config.grafanaUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-8">
              {/* Service Health */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Service Health
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border-border">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                          <Server className="w-4 h-4" />
                          API
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {data.health.status ?? "unknown"}
                        </p>
                      </div>
                      {serviceBadge(data.health.status)}
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          Database
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {data.db.database ?? data.db.status ?? "unknown"}
                        </p>
                      </div>
                      {serviceBadge(data.db.database ?? data.db.status)}
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6 flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                          <Waypoints className="w-4 h-4" />
                          Redis
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {data.redis.redis ?? data.redis.status ?? "unknown"}
                        </p>
                      </div>
                      {serviceBadge(data.redis.redis ?? data.redis.status)}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Workers */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Workers
                  </CardTitle>
                  <CardDescription>
                    Background task workers and current workload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-muted-foreground text-sm mb-1">Workers</p>
                      <p className="text-3xl font-bold text-accent">
                        {data.jobStats.workers}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-muted-foreground text-sm mb-1">
                        Active Tasks
                      </p>
                      <p className="text-3xl font-bold text-blue-500">
                        {data.jobStats.active_tasks}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-muted-foreground text-sm mb-1">
                        Reserved Tasks
                      </p>
                      <p className="text-3xl font-bold text-amber-500">
                        {data.jobStats.reserved_tasks}
                      </p>
                    </div>
                  </div>

                  {workerEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No workers reporting.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {workerEntries.map(([name, info]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <p className="font-medium text-foreground font-mono text-sm">
                            {name}
                          </p>
                          {serviceBadge(info.ok)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scan Summary */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Scan Summary
                  </CardTitle>
                  <CardDescription>
                    Archive scan run counts by status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {SCAN_SEGMENTS.map((segment) => (
                      <div
                        key={segment.key}
                        className="p-4 rounded-lg bg-muted/50 border border-border"
                      >
                        <p className="text-muted-foreground text-sm mb-1">
                          {segment.label}
                        </p>
                        <p className="text-3xl font-bold text-foreground">
                          {data.scanStatus[segment.key]}
                        </p>
                      </div>
                    ))}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-muted-foreground text-sm mb-1">Total</p>
                      <p className="text-3xl font-bold text-accent">
                        {scanTotal}
                      </p>
                    </div>
                  </div>

                  <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted">
                    {scanSegments.map((segment) =>
                      segment.value > 0 ? (
                        <div
                          key={segment.key}
                          className={`${segment.className} transition-all`}
                          style={{ width: `${segment.pct}%` }}
                          title={`${segment.label}: ${segment.value}`}
                        />
                      ) : null,
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    {SCAN_SEGMENTS.map((segment) => (
                      <div
                        key={segment.key}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className={`w-3 h-3 rounded-full ${segment.className}`}
                        />
                        {segment.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Archive Summary */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Archive Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <Card className="border-border">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-sm mb-2">
                        Archive Entries
                      </p>
                      <p className="text-3xl font-bold text-accent">
                        {data.adminStats.archive_entries}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-sm mb-2">
                        Collections
                      </p>
                      <p className="text-3xl font-bold text-accent">
                        {data.adminStats.collections}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground text-sm mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users
                      </p>
                      <p className="text-3xl font-bold text-accent">
                        {data.adminStats.users}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border">
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Metadata Coverage
                        </span>
                        <span className="text-sm font-semibold text-green-500">
                          {Math.round(data.adminStats.metadata_coverage)}%
                        </span>
                      </div>
                      <Progress value={data.adminStats.metadata_coverage} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Verification Coverage
                        </span>
                        <span className="text-sm font-semibold text-blue-500">
                          {Math.round(data.adminStats.verification_coverage)}%
                        </span>
                      </div>
                      <Progress value={data.adminStats.verification_coverage} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="live" className="space-y-8">
              <LiveOperationalDashboard />
            </TabsContent>
            <TabsContent value="metrics" className="space-y-8">
              <PrometheusMetricsPanel />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
