import { apiClient } from "./client";
import type { HealthStatus } from "@/lib/types";

export const healthApi = {
  async getHealth(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>("/health/");
  },

  async getDb(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>("/health/db");
  },

  async getRedis(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>("/health/redis");
  },
};
