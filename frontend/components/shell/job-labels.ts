import type { JobType } from "@/lib/types";

const LABELS: Record<JobType, string> = {
  LIBRARY_SCAN: "Full library scan",
  INCREMENTAL_SCAN: "Scan for changes",
  METADATA_REFRESH: "Refresh metadata",
  ARTWORK_REFRESH: "Download artwork",
  DUPLICATE_DETECTION: "Find duplicates",
  INTEGRITY_VERIFICATION: "Verify files",
};

export function jobLabel(type: JobType | string): string {
  return LABELS[type as JobType] ?? type;
}
