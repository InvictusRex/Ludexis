# Flow: Job Lifecycle

## Overview
Background job creation, execution, monitoring, and cancellation.

## Job Start Flow
```
1. POST /jobs/start {job_type}
   -> JobService.start_job(job_type, user_id)
     -> JobHistoryRepository.create({
          job_type: job_type,
          status: "pending",
          user_id: user_id
        })
     -> match job_type:
       case "scan_full":
         -> scan_full_task.delay(job_id, library_id)
       case "scan_incremental":
         -> scan_incremental_task.delay(job_id, library_id)
       case "artwork_validation":
         -> validate_artwork_task.delay(job_id)
     -> AuditService.record("job.start", ...)
   <- JobHistoryRead {id, job_type, status: "pending"}
```

## Job Execution Flow
```
Celery worker picks up task:
  -> JobService.update_status(job_id, "running")
  -> JobService.update_progress(job_id, 0)
  -> execute business logic (ScannerService, ArtworkService, etc.)
    -> periodically: JobService.update_progress(job_id, percentage)
    -> check: JobService.is_cancelled(job_id)
      -> if cancelled: raise CancelledError
  -> JobService.update_status(job_id, "success")
  -> AuditService.record("job.complete", ...)
```

## Job Cancel Flow
```
POST /jobs/{job_id}/cancel
  -> JobService.cancel_job(job_id)
    -> JobHistoryRepository.update(job_id, {status: "canceled"})
    -> AuditService.record("job.cancel", ...)
  <- JobHistoryRead {id, status: "canceled"}

Task checks is_cancelled():
  -> JobHistoryRepository.get(job_id)
  -> return status == "canceled"
```

## Job List Flow
```
GET /jobs/
  -> JobService.list_jobs(user_id, limit, offset)
    -> JobHistoryRepository.list_by_user(user_id, limit, offset)
  <- [JobHistoryRead]

GET /jobs/{job_id}
  -> JobService.get_job(job_id)
    -> JobHistoryRepository.get(job_id)
  <- JobHistoryRead
```

## Entities Involved
- `service:app.services.job.JobService`
- `repo:app.repositories.job_history.JobHistoryRepository`
- `model:app.models.job_history.JobHistory`
- `task:app.tasks.scan_tasks.scan_full_task`
- `task:app.tasks.scan_tasks.scan_incremental_task`
- `task:app.tasks.artwork_tasks.validate_artwork_task`
- `service:app.services.audit.AuditService`
