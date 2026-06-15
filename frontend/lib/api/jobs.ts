import { apiClient } from "./client";
import type { LibraryJob } from "@/lib/types";

export const jobsApi = {
  async getAll(
    jobType?: string,
    status?: string,
    offset = 0,
    limit = 100,
    token?: string,
  ): Promise<LibraryJob[]> {
    const params = new URLSearchParams();
    if (jobType) params.set("job_type", jobType);
    if (status) params.set("status", status);
    params.set("offset", String(offset));
    params.set("limit", String(limit));

    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<LibraryJob[]>(`/jobs/${qs}`, token);
  },

  async getQueue(token?: string) {
    return jobsApi.getAll(undefined, "QUEUED", 0, 100, token);
  },

  async getRunning(token?: string) {
    return jobsApi.getAll(undefined, "RUNNING", 0, 100, token);
  },

  async getCompleted(token?: string) {
    return jobsApi.getAll(undefined, "COMPLETED", 0, 100, token);
  },

  async start(jobPayload: unknown, token?: string) {
    return apiClient.post<LibraryJob>(`/jobs/start`, jobPayload, token);
  },

  async cancel(jobId: string, token?: string) {
    return apiClient.post<LibraryJob>(
      `/jobs/${jobId}/cancel`,
      undefined,
      token,
    );
  },
};
