import { apiClient } from "./client";
import type { JobHistory, JobHistoryCreate, JobType } from "@/lib/types";

export const jobsApi = {
  async getAll(
    jobType?: JobType,
    status?: string,
    offset = 0,
    limit = 100,
  ): Promise<JobHistory[]> {
    const params = new URLSearchParams();
    if (jobType) params.set("job_type", jobType);
    if (status) params.set("status", status);
    params.set("offset", String(offset));
    params.set("limit", String(limit));

    return apiClient.get<JobHistory[]>(`/jobs/?${params.toString()}`);
  },

  async start(jobType: JobType): Promise<JobHistory> {
    const payload: JobHistoryCreate = { job_type: jobType };
    return apiClient.post<JobHistory>("/jobs/start", payload);
  },

  async cancel(jobId: string): Promise<JobHistory> {
    return apiClient.post<JobHistory>(`/jobs/${jobId}/cancel`);
  },
};
