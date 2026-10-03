export interface ScheduledTask {
  key: string;
  name: string;
  job_type: string;
  enabled: boolean;
  hour: number;
  minute: number;
  // 0 = Monday ... 6 = Sunday; null runs every day.
  day_of_week: number | null;
  last_run_at: string | null;
  last_job_id: string | null;
  last_job_status: string | null;
  next_run_at: string | null;
}

export interface ScheduledTaskUpdate {
  enabled?: boolean;
  hour?: number;
  minute?: number;
  // -1 makes a weekly task daily.
  day_of_week?: number;
}

export interface ServerSettings {
  server_name: string;
  provider_order: string[];
  available_providers: string[];
  igdb_client_id: string;
  igdb_configured: boolean;
  igdb_from_env: boolean;
}

export interface ServerSettingsUpdate {
  server_name?: string;
  provider_order?: string[];
  igdb_client_id?: string;
  igdb_client_secret?: string;
}
