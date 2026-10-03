import { apiClient } from "./client";
import type {
  JobHistory,
  ScheduledTask,
  ScheduledTaskUpdate,
  ServerSettings,
  ServerSettingsUpdate,
} from "@/lib/types";

export const systemApi = {
  async getScheduledTasks(): Promise<ScheduledTask[]> {
    return apiClient.get<ScheduledTask[]>("/admin/scheduled-tasks");
  },

  async updateScheduledTask(key: string, data: ScheduledTaskUpdate): Promise<ScheduledTask> {
    return apiClient.patch<ScheduledTask>(`/admin/scheduled-tasks/${key}`, data);
  },

  async runScheduledTask(key: string): Promise<JobHistory> {
    return apiClient.post<JobHistory>(`/admin/scheduled-tasks/${key}/run`);
  },

  async getSettings(): Promise<ServerSettings> {
    return apiClient.get<ServerSettings>("/admin/settings");
  },

  async updateSettings(data: ServerSettingsUpdate): Promise<ServerSettings> {
    return apiClient.patch<ServerSettings>("/admin/settings", data);
  },
};
