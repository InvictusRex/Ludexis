import { apiClient } from "./client";
import type { JobMonitorStats, JobMonitorWorker } from "@/lib/types";

export const jobMonitorApi = {
  async getStats(): Promise<JobMonitorStats> {
    return apiClient.get<JobMonitorStats>("/job-monitor/stats");
  },

  async getWorkers(): Promise<JobMonitorWorker> {
    return apiClient.get<JobMonitorWorker>("/job-monitor/workers");
  },
};
