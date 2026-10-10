import { apiClient } from "./client";
import type { SetupStatus } from "@/lib/types";

export const setupApi = {
  async getStatus(): Promise<SetupStatus> {
    return apiClient.get<SetupStatus>("/setup/status");
  },
};
