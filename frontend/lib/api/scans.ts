import { apiClient } from "./client";
import type { ScanStatus } from "@/lib/types";

export const scansApi = {
  async runFull(): Promise<unknown> {
    return apiClient.post<unknown>("/scan/full");
  },

  async runIncremental(): Promise<unknown> {
    return apiClient.post<unknown>("/scan/incremental");
  },

  async getStatus(): Promise<ScanStatus> {
    return apiClient.get<ScanStatus>("/scan/status");
  },
};
