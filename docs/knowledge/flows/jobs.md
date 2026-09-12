# Flow: Background jobs

Job creation, task selection, execution, cancellation, scheduling and monitoring. Domain doc: `docs/knowledge/domains/job.md`.

## Celery setup
- App: `celery_app = Celery("ludexis", broker=settings.CELERY_BROKER_URL, backend=settings.CELERY_RESULT_BACKEND)` in `backend/app/tasks/celery_app.py`; JSON serialization, `timezone="UTC"`.
- Task modules registered by import at the bottom of `celery_app.py`: `app.tasks.scan_tasks`, `app.tasks.artwork_tasks`, `app.tasks.metadata_tasks`.
- Beat schedule (`celery_app.conf.beat_schedule`):

| Entry | Task name | Schedule |
|---|---|---|
| `daily-metadata-refresh` | `app.tasks.metadata_tasks.scheduled_metadata_refresh_task` | `crontab(hour=3, minute=0)` (03:00 UTC daily) |
| `daily-artwork-validation` | `app.tasks.artwork_tasks.scheduled_artwork_validation_task` | `crontab(hour=4, minute=0)` (04:00 UTC daily) |

## 1. Start a job
```
frontend/app/admin/jobs/page.tsx  (start button, JOB_TYPES select)
frontend/app/admin/page.tsx       (quick actions: jobsApi.start("METADATA_REFRESH"), jobsApi.start("INTEGRITY_VERIFICATION"))
  -> jobsApi.start(jobType)                                  frontend/lib/api/jobs.ts
     POST /api/jobs/start {job_type}                         RUN_SCANS
     -> start_job(data: JobHistoryCreate, current_user, db)  backend/app/api/jobs.py
        -> JobService.start_job(db, current_user, data.job_type)    backend/app/services/job.py
           -> JobHistoryRepository.create(db, {job_type, status: PENDING, progress: 0, details: "Queued", user_id})
           -> JobService._select_task(job_type)
                LIBRARY_SCAN      -> scan_full_task
                INCREMENTAL_SCAN  -> scan_incremental_task
                ARTWORK_REFRESH   -> validate_artwork_task
                anything else     -> run_job   (METADATA_REFRESH, DUPLICATE_DETECTION, INTEGRITY_VERIFICATION)
           -> task.apply_async(args=[job.id])
           -> JobHistoryRepository.update(db, job, {task_id, details: "Queued task <id>"})
     <- 201 JobHistoryRead
```
`POST /api/scan/full` and `POST /api/scan/incremental` call the same `JobService.start_job` with `LIBRARY_SCAN` / `INCREMENTAL_SCAN` (see `docs/knowledge/flows/scan.md`). No job start writes an audit log except the two scan routes.

## 2. Task execution (worker)
Every real task follows the same pattern; there is no service method for status updates, tasks mutate the `JobHistory` row directly:
```
<task>(self, job_history_id)
  db = SessionLocal()
  job = JobHistoryRepository().get(db, job_history_id)        "job not found" if None
  job.status = RUNNING ; job.details = "... started" ; db.add(job) ; db.commit()
  <business call>
     scan_full_task         -> ScannerService().scan_full(db, job_id=job.id)
     scan_incremental_task  -> ScannerService().scan_incremental(db, job_id=job.id)
     validate_artwork_task  -> ArtworkService().validate_all_artwork(db)
     refresh_metadata_task  -> MetadataService().refresh_all(db, job.id)
  stats["cancelled"] -> status CANCELED, else SUCCESS ; progress = 100 ; result/details ; completed_at
  except Exception -> status FAILED, details/result = str(exc), completed_at ; re-raise (autoretry)
  finally db.close()
```
- Real tasks: `autoretry_for=(Exception,)`, `retry_backoff=True`, `retry_backoff_max=settings.JOB_RETRY_BACKOFF_MAX` (300), `max_retries=settings.JOB_MAX_RETRIES` (5).
- `validate_artwork_task` has no cancellation check and always ends `SUCCESS` unless it raises.
- `run_job` (stub): sets RUNNING, then 5 iterations of `progress = step/5*100`, `time.sleep(1)`, then SUCCESS with `"<job_type> completed successfully"`. No retry policy.

## 3. Cancel
```
frontend/app/admin/jobs/page.tsx -> jobsApi.cancel(jobId)
  POST /api/jobs/{job_id}/cancel                              RUN_SCANS
  -> cancel_job(job_id, ...)                                  backend/app/api/jobs.py
     -> JobService.cancel_job(db, job_id)                     404 if None
        status not PENDING/RUNNING -> return job unchanged
        job.task_id -> celery_app.control.revoke(task_id, terminate=True)
        -> JobHistoryRepository.update(db, job, {status: CANCELED, details: "Canceled", completed_at})
Cooperative checks while running:
  ScannerService._job_cancelled(db, job_id)   (per library and per item)
  MetadataService.refresh_all                 (per archive, queries JobHistory.status)
```
`JobService.is_cancelled` exists but nothing calls it.

## 4. Scheduled jobs (beat)
```
03:00 UTC  scheduled_metadata_refresh_task()                  backend/app/tasks/metadata_tasks.py
  -> query JobHistory for METADATA_REFRESH in (PENDING, RUNNING) -> return early if found
  -> INSERT JobHistory(job_type=METADATA_REFRESH, status=PENDING, details="Scheduled metadata refresh")
  -> refresh_metadata_task.delay(job.id) ; save task_id
04:00 UTC  scheduled_artwork_validation_task()                backend/app/tasks/artwork_tasks.py
  -> INSERT JobHistory(job_type=ARTWORK_REFRESH, status=PENDING, details="Scheduled artwork validation")
  -> validate_artwork_task.delay(job.id) ; save task_id       (no duplicate-run guard)
```
Scheduled jobs have `user_id = NULL`.

## 5. List and monitor
```
jobsApi.getAll(jobType?, status?, offset, limit)  GET /api/jobs/?job_type&status&offset&limit
  -> list_jobs -> JobService.list_jobs -> JobHistoryRepository.list_items   (ORDER BY started_at DESC)
  callers: frontend/app/admin/jobs/page.tsx (polls every 5 s while a job is PENDING/RUNNING),
           JobsReport, BackgroundTaskAnalytics (limit 500), adminApi.getRecentJobs (limit 10),
           frontend/app/admin/analytics/page.tsx
jobsApi.getById(id)  GET /api/jobs/{job_id} -> JobService.get_job -> JobHistoryRepository.get
scansApi.getStatus() GET /api/scan/status   -> JobHistoryRepository.count_by_status(db, [LIBRARY_SCAN, INCREMENTAL_SCAN])
jobMonitorApi.getStats()   GET /api/job-monitor/stats   (ACCESS_ADMIN) -> JobMonitorService.stats()
                             -> celery_app.control.inspect(): ping(), active(), reserved()
                             <- {workers, active_tasks, reserved_tasks}
jobMonitorApi.getWorkers() GET /api/job-monitor/workers (ACCESS_ADMIN) -> JobMonitorService.workers() -> inspect().ping()
  callers: frontend/app/admin/monitoring/page.tsx, frontend/app/admin/settings/page.tsx,
           LiveOperationalDashboard (stats only, polls every 10 s)
```

## Entities
`router:app.api.jobs`, `router:app.api.job_monitor`, `service:app.services.job.JobService`, `service:app.services.job_monitor.JobMonitorService`, `repo:app.repositories.job_history.JobHistoryRepository`, `model:app.models.job_history.JobHistory`, `task:app.tasks.celery_app.run_job`, `task:app.tasks.scan_tasks.scan_full_task`, `task:app.tasks.scan_tasks.scan_incremental_task`, `task:app.tasks.artwork_tasks.validate_artwork_task`, `task:app.tasks.artwork_tasks.scheduled_artwork_validation_task`, `task:app.tasks.metadata_tasks.refresh_metadata_task`, `task:app.tasks.metadata_tasks.scheduled_metadata_refresh_task`, `table:job_history`, `extprov:Celery`, `page:/admin/jobs`, `apimod:lib/api/jobs`, `apimod:lib/api/job-monitor`.
