# Flow: Library scan

From the admin button to `archive_entries` rows. Domain doc: `docs/knowledge/domains/scan.md`.

## 1. Trigger
```
frontend/app/admin/library/page.tsx -> scansApi.runFull() | scansApi.runIncremental()     frontend/lib/api/scans.ts
frontend/app/admin/page.tsx         -> scansApi.runFull()
frontend/app/admin/jobs/page.tsx    -> jobsApi.start("LIBRARY_SCAN" | "INCREMENTAL_SCAN")  (same backend path via /api/jobs/start)
  POST /api/scan/full   | POST /api/scan/incremental                    RUN_SCANS
  -> start_full_scan | start_incremental_scan (current_user, db)        backend/app/api/scan.py
     -> JobService.start_job(db, current_user, JobType.LIBRARY_SCAN | JobType.INCREMENTAL_SCAN)
        -> JobHistoryRepository.create(... PENDING ...)
        -> scan_full_task | scan_incremental_task .apply_async(args=[job.id])
        -> JobHistoryRepository.update(db, job, {task_id, details})
     -> AuditService.log(db, action=AuditAction.RUN_FULL_SCAN | RUN_INCREMENTAL_SCAN, entity="Scan", user_id=...)
  <- 201 JobHistoryRead (status PENDING)
```

## 2. Worker: shared job runner
```
scan_full_task(self, job_history_id) | scan_incremental_task(...)      backend/app/tasks/scan_tasks.py
  @celery_app.task(**JOB_TASK_OPTIONS)  bind, autoretry_for=(Exception,), retry_backoff (cap JOB_RETRY_BACKOFF_MAX), max_retries=JOB_MAX_RETRIES
  -> run_job(task, job_history_id, label, work)                         backend/app/tasks/job_runner.py
       job.status RUNNING ; job.retry_count = task.request.retries ; commit
       report(done, total) -> job.progress = done * 100 // total (commit when it changes)
       stats = work(db, report, job.id)
       stats["cancelled"] -> CANCELED, else SUCCESS ; progress 100 ; result/details = summarize(stats) ; completed_at
       exception -> rollback ; FAILED ; result = error ; re-raise (Celery retries re-run the same row)
  work = ScannerService.scan_full | scan_incremental(db, job_id=..., on_progress=report), then _queue_enrichment
```

## 3. Discovery (`ScannerService._scan`)
```
targets = enabled libraries from LibraryRepository.list_active(db)      (deleted_at IS NULL)
items   = ScannerService._discover_items(Path(library.path)) per target  (everything discovered before processing)
  sorted(iterdir()); unreadable directory -> logged, skipped
  file with suffix in SUPPORTED_ARCHIVE_EXTENSIONS (.zip .rar .7z .iso .exe) -> _scan_file(path)
  directory where _is_game_folder(path)  -> _scan_folder(path)  (one entry; not descended)
      _is_game_folder: any non-archive file that is not a dotfile, desktop.ini or thumbs.db
  other directory (only archives/subfolders) -> recurse
  title/version: parse_archive_name(name)   backend/app/utils/normalization.py
incremental only: keep items where _needs_processing(item, {e.file_path: e for e in ArchiveEntryRepository.list_all(db)})
  (path unknown, or file_size / modified_time differ)
for each item: _job_cancelled -> stats["cancelled"] ; return
               _process_item(db, item, library_id, stats) ; on_progress(done, total)
stats = {created, updated, moved, errors, cancelled, created_ids}
```

## 4. Per-item processing (`ScannerService._process_item` -> `_ingest`)
```
_process_item: try _ingest ; except -> db.rollback() ; stats["errors"] += 1 ; log ; next item
_ingest:
  1. ArchiveEntryRepository.get_by_file_path(db, item.file_path)
       found, size/mtime unchanged and hash present -> skip
       found, changed (or hash missing) -> _ensure_file_hash ; update size/mtime/hash ;
             verification_status UNKNOWN if changed ; stats["updated"] += 1
  2. _ensure_file_hash(item) -> _compute_file_hash(path)   SHA-256, 1 MiB chunks; None for a directory
     for candidate in ArchiveEntryRepository.get_all_by_hash(db, file_hash):
       candidate's file no longer exists -> move: update file_path/size/mtime/library_id ; stats["moved"] += 1
       (old file still exists -> this is a copy; fall through and create its own entry)
  3. ArchiveEntryRepository.create(db, {title, version, archive_type, file_path, metadata_status UNMATCHED,
        verification_status UNKNOWN, library_id, file_size, modified_time, file_hash})
     stats["created"] += 1 ; stats["created_ids"].append(id)
```

## 5. Enrichment hand-off (`_queue_enrichment` in `backend/app/tasks/scan_tasks.py`)
```
if stats["created_ids"]:
  JobService().start_job(db, scan_job.user, JobType.METADATA_REFRESH,
                         details="Enrich N new entries", task_kwargs={"entry_ids": created_ids})
  stats["enrichment_job_id"] = job.id
```
The enrichment job is described in `docs/knowledge/flows/metadata.md`.

## 6. Watching progress (frontend)
```
frontend/app/admin/library/page.tsx -> scansApi.getStatus()   GET /api/scan/status
  -> read_scan_status -> JobHistoryRepository.count_by_status(db, [LIBRARY_SCAN, INCREMENTAL_SCAN])
  <- ScanStatus {pending, running, success, failed, canceled, total}
frontend/app/admin/jobs/page.tsx -> jobsApi.getAll(...)  GET /api/jobs/  (polls every 5 s while active; shows progress and "retry N")
```

## 7. After the scan
- Duplicates: `frontend/app/admin/duplicates/page.tsx` -> `archiveApi.getDuplicates()` -> `GET /api/archive-entries/duplicates` -> `ScannerService.find_duplicates(db)` -> `ArchiveEntryRepository.list_with_hashes(db)`, grouped by `file_hash` where count > 1.

## Entities
`router:app.api.scan`, `service:app.services.job.JobService`, `service:app.services.scanner.ScannerService`, `service:app.services.enrichment.EnrichmentService`, `task:app.tasks.metadata_tasks.refresh_metadata_task`, `class:app.services.scanner.ArchiveScanItem`, `task:app.tasks.scan_tasks.scan_full_task`, `task:app.tasks.scan_tasks.scan_incremental_task`, `repo:app.repositories.archive_entry.ArchiveEntryRepository`, `repo:app.repositories.library.LibraryRepository`, `repo:app.repositories.job_history.JobHistoryRepository`, `module:app.utils.normalization`, `table:archive_entries`, `table:libraries`, `table:job_history`, `page:/admin/library`, `apimod:lib/api/scans`.
