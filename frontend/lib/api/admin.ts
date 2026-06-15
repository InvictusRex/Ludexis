import { jobsApi } from "./jobs";

export const adminApi = {
  async getRecentJobs(token?: string) {
    return jobsApi.getAll(undefined, undefined, 0, 10, token);
  },

  async getStats(token?: string) {
    // placeholder - real implementation should call an admin stats endpoint
    return {
      totalEntries: 0,
      unmatchedEntries: 0,
      totalStorage: "0 B",
      metadataCoverage: 0,
    };
  },
};
