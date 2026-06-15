export type JobType =
  | "LIBRARY_SCAN"
  | "INCREMENTAL_SCAN"
  | "METADATA_REFRESH"
  | "ARTWORK_REFRESH"
  | "DUPLICATE_DETECTION"
  | "INTEGRITY_VERIFICATION";

export type JobStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELED";

export interface JobHistory {
  id: string;
  job_type: JobType;
  status?: JobStatus;
  progress?: number;
  details?: string;
  result?: string;
  task_id?: string;
  user_id?: string;
  started_at?: string;
  completed_at?: string;
}

export interface LibraryJob {
  id: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed" | "canceled" | string;
  progress?: number;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
}
