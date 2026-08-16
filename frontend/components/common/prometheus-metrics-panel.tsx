"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { config } from "@/lib/config";
import { getAccessToken } from "@/lib/auth/token-store";
import { toastError } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const METRICS_URL =
  config.apiBaseUrl.replace(/\/api\/?$/, "") + "/api/metrics";

const AUTO_REFRESH_MS = 15_000;

const QUICK_METRICS: Array<{ name: string; label: string }> = [
  { name: "http_requests_total", label: "HTTP Requests" },
  { name: "ludexis_artwork_downloads_total", label: "Artwork Downloads" },
  { name: "ludexis_metadata_searches_total", label: "Metadata Searches" },
];

function sumMetricFamily(body: string, name: string): number | null {
  let sum = 0;
  let found = false;
  const sampleRe =
    /^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?[^}]*\}?\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$/;
  for (const rawLine of body.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(sampleRe);
    if (!match || match[1] !== name) continue;
    sum += parseFloat(match[2]);
    found = true;
  }
  return found ? sum : null;
}

function formatCount(value: number): string {
  return Number.isInteger(value)
    ? value.toLocaleString("en-US")
    : value.toFixed(2);
}

export function PrometheusMetricsPanel() {
  const [metrics, setMetrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      const response = await fetch(METRICS_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error(
          `Metrics request failed with status ${response.status}`,
        );
      }
      const body = await response.text();
      setMetrics(body);
    } catch (err) {
      console.error("Failed to load Prometheus metrics:", err);
      toastError(err, "Failed to load metrics.");
      setError("Failed to load metrics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadMetrics();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [autoRefresh, loadMetrics]);

  const lineCount = metrics
    ? metrics.split("\n").filter((line) => line.trim()).length
    : 0;

  const quickCounters = metrics
    ? QUICK_METRICS.map(({ name, label }) => ({
        label,
        value: sumMetricFamily(metrics, name),
      })).filter(
        (counter): counter is { label: string; value: number } =>
          counter.value !== null,
      )
    : [];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Prometheus Metrics
        </CardTitle>
        <CardDescription>
          Raw Prometheus text endpoint:{" "}
          <span className="font-mono">{METRICS_URL}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {lineCount > 0 && (
              <Badge variant="secondary" className="border-border">
                {lineCount} metric lines
              </Badge>
            )}
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={loadMetrics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {quickCounters.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickCounters.map((counter) => (
              <div
                key={counter.label}
                className="p-4 rounded-lg bg-muted/50 border border-border"
              >
                <p className="text-muted-foreground text-sm mb-1">
                  {counter.label}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCount(counter.value)}
                </p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-fit border-border"
              onClick={loadMetrics}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {metrics ? (
          <ScrollArea className="h-80 rounded-lg border border-border bg-muted/30">
            <pre className="p-4 text-xs leading-relaxed font-mono text-foreground whitespace-pre">
              {metrics}
            </pre>
          </ScrollArea>
        ) : (
          !error && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading metrics...
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
