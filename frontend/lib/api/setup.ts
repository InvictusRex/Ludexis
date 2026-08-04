import { apiClient } from "./client";
import type { SetupStatus, UserCreate } from "@/lib/types";

export const setupApi = {
  async getStatus(): Promise<SetupStatus> {
    return apiClient.get<SetupStatus>("/setup/status");
  },

  async initialize(data: UserCreate): Promise<unknown> {
    return apiClient.post<unknown>("/setup/initialize", data);
  },
};
