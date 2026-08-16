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

export interface JobHistoryCreate {
  job_type: JobType;
}

export interface JobMonitorStats {
  workers: number;
  active_tasks: number;
  reserved_tasks: number;
}

export type JobMonitorWorker = Record<string, { ok?: string }>;

export interface ScanStatus {
  pending: number;
  running: number;
  success: number;
  failed: number;
  canceled: number;
  total: number;
}
