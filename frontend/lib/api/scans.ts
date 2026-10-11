import { apiClient } from "./client";
import type { ScanStatus } from "@/lib/types";

const libraryQuery = (libraryId?: string) => (libraryId ? `?library_id=${encodeURIComponent(libraryId)}` : "");

export const scansApi = {
  /** Scans every enabled library, or only the given one. */
  async runFull(libraryId?: string): Promise<unknown> {
    return apiClient.post<unknown>(`/scan/full${libraryQuery(libraryId)}`);
  },

  async runIncremental(libraryId?: string): Promise<unknown> {
    return apiClient.post<unknown>(`/scan/incremental${libraryQuery(libraryId)}`);
  },

  async getStatus(): Promise<ScanStatus> {
    return apiClient.get<ScanStatus>("/scan/status");
  },
};
