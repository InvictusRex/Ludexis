# Domain: Job

Background job records (`job_history`) and their Celery tasks: start, cancel, list, and live worker/queue monitoring. Scans and artwork validation run as real tasks; other job types fall back to the simulated `run_job` task.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/jobs.py` | Router `/jobs` | `start_job`, `cancel_job`, `list_jobs`, `read_job` |
| `backend/app/api/job_monitor.py` | Router `/job-monitor` | `list_workers`, `queue_stats` |
| `backend/app/services/job.py` | Service | `JobService.list_jobs`, `get_job`, `start_job`, `_select_task`, `cancel_job`, `is_cancelled` |
| `backend/app/services/job_monitor.py` | Service (Celery inspect) | `JobMonitorService.workers`, `active`, `reserved`, `stats` |
| `backend/app/repositories/job_history.py` | Repository | `JobHistoryRepository.list_items`, `count_by_status`, `list_by_status`, `get_by_task_id` |
| `backend/app/models/job_history.py` | Model | `JobHistory` |
| `backend/app/schemas/job_history.py` | Schemas | `JobHistoryCreate`, `JobHistoryRead`, `JobHistoryBase`, `JobStartRequest` |
| `backend/app/tasks/celery_app.py` | Celery app, stub task, beat schedule | `celery_app`, `run_job` |
| `backend/app/utils/enums.py` | Enums | `JobType`, `JobStatus` |
| `backend/app/core/config.py` | Settings | `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `JOB_MAX_RETRIES`, `JOB_RETRY_BACKOFF_MAX` |
| `frontend/app/admin/jobs/page.tsx` | Jobs page | `jobsApi.getAll`, `jobsApi.start`, `jobsApi.cancel` |
| `frontend/app/admin/page.tsx` | Admin dashboard quick actions | `jobsApi.start`, `scansApi.runFull`, `adminApi.getRecentJobs` |
| `frontend/app/admin/monitoring/page.tsx` | Monitoring page | `jobMonitorApi.getStats`, `jobMonitorApi.getWorkers`, `healthApi.*`, `scansApi.getStatus` |
| `frontend/components/common/jobs-report.tsx` | Component | `JobsReport` |
| `frontend/components/common/background-task-analytics.tsx` | Component | `BackgroundTaskAnalytics` |
| `frontend/components/common/live-operational-dashboard.tsx` | Component | `LiveOperationalDashboard`, `LIVE_POLL_INTERVAL_MS` |
| `frontend/lib/api/jobs.ts` | API module | `jobsApi.getAll`, `getById`, `getPending`, `getRunning`, `getCompleted`, `start`, `cancel` |
| `frontend/lib/api/job-monitor.ts` | API module | `jobMonitorApi.getStats`, `getWorkers` |
| `frontend/lib/types/jobs.ts` | Types | `JobType`, `JobStatus`, `JobHistory`, `JobHistoryCreate`, `JobMonitorStats`, `JobMonitorWorker`, `ScanStatus` |
| `backend/tests/test_jobs.py`, `backend/tests/test_scan_jobs_api.py` | Backend tests | |
| `frontend/components/common/jobs-report.test.tsx`, `frontend/components/common/background-task-analytics.test.tsx`, `frontend/components/common/live-operational-dashboard.test.tsx`, `frontend/e2e/jobs.spec.ts` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.jobs`, `router:app.api.job_monitor` |
| Service | `service:app.services.job.JobService`, `service:app.services.job_monitor.JobMonitorService` |
| Repository | `repo:app.repositories.job_history.JobHistoryRepository` |
| Model | `model:app.models.job_history.JobHistory` |
| Schema | `schema:app.schemas.job_history.JobHistoryCreate`, `schema:app.schemas.job_history.JobHistoryRead` |
| Task | `task:app.tasks.celery_app.run_job` |
| DBEnum | `dbenum:job_type`, `dbenum:job_status` |
| ExternalProvider | `extprov:Celery` |
| Table | `table:job_history` |
| Page | `page:/admin/jobs`, `page:/admin`, `page:/admin/monitoring` |
| Component | `comp:components/common/jobs-report`, `comp:components/common/background-task-analytics`, `comp:components/common/live-operational-dashboard` |
| ApiModule | `apimod:lib/api/jobs`, `apimod:lib/api/job-monitor` |
| TypeModule | `typemod:lib/types/jobs` |
| TestFile | `test:backend/tests/test_jobs.py`, `test:backend/tests/test_scan_jobs_api.py`, `test:frontend/e2e/jobs.spec.ts` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| POST | `/api/jobs/start` | `start_job` (`backend/app/api/jobs.py`) | RUN_SCANS | `apifn:lib/api/jobs.jobsApi.start` |
| POST | `/api/jobs/{job_id}/cancel` | `cancel_job` (`backend/app/api/jobs.py`) | RUN_SCANS | `apifn:lib/api/jobs.jobsApi.cancel` |
| GET | `/api/jobs/` | `list_jobs` (`backend/app/api/jobs.py`) | authenticated | `apifn:lib/api/jobs.jobsApi.getAll` |
| GET | `/api/jobs/{job_id}` | `read_job` (`backend/app/api/jobs.py`) | authenticated | `apifn:lib/api/jobs.jobsApi.getById` |
| GET | `/api/job-monitor/workers` | `list_workers` (`backend/app/api/job_monitor.py`) | ACCESS_ADMIN | `apifn:lib/api/job-monitor.jobMonitorApi.getWorkers` |
| GET | `/api/job-monitor/stats` | `queue_stats` (`backend/app/api/job_monitor.py`) | ACCESS_ADMIN | `apifn:lib/api/job-monitor.jobMonitorApi.getStats` |

## Tables
`job_history` (insert by `JobService.start_job` and the scheduled tasks; status/progress/result written by tasks directly on the ORM object).

## Change guide
- Make a job type run real work: add a Celery task (pattern: `backend/app/tasks/scan_tasks.py`), import it in `backend/app/services/job.py` and return it from `JobService._select_task`; make sure `backend/app/tasks/celery_app.py` imports the task module.
- New job type: add to `JobType` in `backend/app/utils/enums.py`, a migration altering the `job_type` PostgreSQL enum in `backend/alembic/versions/`, `JobType` in `frontend/lib/types/jobs.ts`, and `JOB_TYPES` in `frontend/app/admin/jobs/page.tsx`.
- New `JobHistory` field: `backend/app/models/job_history.py`, `JobHistoryBase` in `backend/app/schemas/job_history.py`, migration, `JobHistory` in `frontend/lib/types/jobs.ts`.
- New monitor metric: `JobMonitorService` (`backend/app/services/job_monitor.py`), route in `backend/app/api/job_monitor.py`, `jobMonitorApi` + `JobMonitorStats`.

## Notes
- `JobService._select_task`: `LIBRARY_SCAN` -> `scan_full_task`, `INCREMENTAL_SCAN` -> `scan_incremental_task`, `ARTWORK_REFRESH` -> `validate_artwork_task`; `METADATA_REFRESH`, `DUPLICATE_DETECTION`, `INTEGRITY_VERIFICATION` -> `run_job`, a stub that only advances `progress` in 5 one-second steps and reports success. The admin dashboard buttons for `METADATA_REFRESH` and `INTEGRITY_VERIFICATION` therefore run the stub; the real metadata refresh runs only from the beat schedule.
- `JobService.cancel_job` revokes the Celery task (`terminate=True`) and sets `CANCELED`; jobs not `PENDING`/`RUNNING` are returned unchanged. Scans and metadata refresh also poll the row for `CANCELED` between items.
- `JobService.is_cancelled`, `JobHistoryRepository.list_by_status` and `get_by_task_id` have no callers; `job_history.retry_count` is never written.
- Real tasks use `autoretry_for=(Exception,)`, `retry_backoff=True`, `max_retries=JOB_MAX_RETRIES` (5), `retry_backoff_max=JOB_RETRY_BACKOFF_MAX` (300 s). `run_job` has no retry.
- `GET /api/jobs/` is ordered by `started_at` desc and accepts `job_type`, `status`, `offset`, `limit`.
- `frontend/app/admin/jobs/page.tsx` polls every 5 s while any job is active; `LiveOperationalDashboard` polls every 10 s.
- `/api/job-monitor/*` return raw dicts (no `response_model`).
