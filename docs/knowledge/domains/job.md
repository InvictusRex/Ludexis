# Domain: Job

## Overview
Background job management — tracks Celery task execution, provides job lifecycle (start, cancel, status), and worker monitoring.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.job_history.JobHistory` | JobHistory |
| Repository | `repo:app.repositories.job_history.JobHistoryRepository` | JobHistoryRepository |
| Service | `service:app.services.job.JobService` | JobService |
| Service | `service:app.services.job_monitor.JobMonitorService` | JobMonitorService |
| Task | `task:app.tasks.celery_app.run_job` | run_job |

## Related Tables
- `job_history` — job execution records

## Job Types
| Type | Description |
|------|-------------|
| `scan_full` | Full library scan |
| `scan_incremental` | Incremental library scan |
| `metadata_refresh` | Metadata enrichment refresh |
| `artwork_validation` | Artwork validation |

## Job Status
| Status | Description |
|--------|-------------|
| `pending` | Created, not yet started |
| `running` | Currently executing |
| `success` | Completed successfully |
| `failed` | Completed with errors |
| `canceled` | User-canceled |

## API Endpoints
- `POST /jobs/start` — start a new job
- `POST /jobs/{id}/cancel` — cancel a running job
- `GET /jobs/` — list job history
- `GET /jobs/{id}` — get job details
- `GET /job-monitor/workers` — list active Celery workers
- `GET /job-monitor/stats` — queue statistics

## Notes
- Job history is immutable (no update/delete endpoints)
- Cancellation sets a flag; task checks `is_cancelled()` periodically
- Worker monitoring uses Celery inspect API
- Retry policy: up to 5 retries with exponential backoff (max 300s)
