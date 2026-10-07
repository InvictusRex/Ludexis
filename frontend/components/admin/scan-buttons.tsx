"use client";

import { useState } from "react";
import { RefreshCw, ScanSearch } from "lucide-react";
import { scansApi } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { announceJobsChanged } from "@/components/shell/jobs-indicator";

/** Scan for changes and Full scan, for users who may run scans. */
export function ScanButtons({ onStarted }: { onStarted?: () => void }) {
  const [starting, setStarting] = useState<"full" | "incremental" | null>(null);

  const scan = async (kind: "full" | "incremental") => {
    setStarting(kind);
    try {
      await (kind === "full" ? scansApi.runFull() : scansApi.runIncremental());
      toastSuccess(kind === "full" ? "Full scan started" : "Scan for changes started");
      announceJobsChanged();
      onStarted?.();
    } catch (error) {
      toastError(error, "Could not start the scan");
    } finally {
      setStarting(null);
    }
  };

  return (
    <>
      <Button onClick={() => scan("incremental")} disabled={starting !== null}>
        <ScanSearch className={starting === "incremental" ? "motion-safe:animate-pulse" : undefined} />
        Scan for changes
      </Button>
      <Button variant="outline" onClick={() => scan("full")} disabled={starting !== null}>
        <RefreshCw className={starting === "full" ? "motion-safe:animate-spin" : undefined} />
        Full scan
      </Button>
    </>
  );
}
