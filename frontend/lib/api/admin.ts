import { jobsApi } from "./jobs";
import { apiClient } from "./client";
import type {
  AdminStats,
  AuditLogQuery,
  AuditLogRead,
  JobHistory,
  PermissionReport,
} from "@/lib/types";

export const adminApi = {
  async getRecentJobs(): Promise<JobHistory[]> {
    return jobsApi.getAll(undefined, undefined, 0, 10);
  },

  async getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>("/admin/stats");
  },

  async getAuditLogs(query: AuditLogQuery = {}): Promise<AuditLogRead[]> {
    const params = new URLSearchParams();

    if (query.user_id) params.set("user_id", query.user_id);
    if (query.entity) params.set("entity", query.entity);
    if (query.action) params.set("action", query.action);
    params.set("offset", String(query.offset ?? 0));
    params.set("limit", String(query.limit ?? 100));

    return apiClient.get<AuditLogRead[]>(`/admin/audit-logs?${params}`);
  },

  async getPermissionReport(): Promise<PermissionReport> {
    return apiClient.get<PermissionReport>("/admin/permission-report");
  },
};
