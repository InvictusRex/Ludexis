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
     -> AuditLogService.log(db, action=AuditAction.RUN_FULL_SCAN | RUN_INCREMENTAL_SCAN, entity="Scan", user_id=...)
  <- 201 JobHistoryRead (status PENDING)
```

## 2. Worker: full scan
```
scan_full_task(job_history_id)                                         backend/app/tasks/scan_tasks.py
  -> JobHistoryRepository.get ; status RUNNING ; commit
  -> ScannerService.scan_full(db, job_id=job.id)                       backend/app/services/scanner.py
     library_scans_total.inc()
     for library in LibraryRepository.list_active(db):                 (deleted_at IS NULL)
        ScannerService._job_cancelled(db, job_id) -> return {"cancelled": True, ...}
        skip if not library.enabled
        items = ScannerService._discover_items(Path(library.path))
           rglob("*"): file with suffix in SUPPORTED_ARCHIVE_EXTENSIONS -> _scan_file(path)
                       directory                                         -> _scan_folder(path)
           _scan_file: parse_archive_name(path.name) (backend/app/utils/normalization.py), stat size/mtime
        ScannerService._process_items(db, items, library_id=library.id, job_id=job_id)  (see 4)
        aggregate created / matched / partial / unmatched
  -> status SUCCESS (or CANCELED) ; progress 100 ; result "Full scan completed: {stats}" ; completed_at
```

## 3. Worker: incremental scan
```
scan_incremental_task -> ScannerService.scan_incremental(db, job_id=job.id)
  incremental_scans_total.inc()
  existing_entries = {e.file_path: e for e in ArchiveEntryRepository.list_all(db)}
  per enabled library: items = [i for i in _discover_items(path) if ScannerService._needs_processing(i, existing_entries)]
     _needs_processing: path unknown, or file_size / modified_time differ
  -> ScannerService._process_items(...)
```

## 4. Per-item processing (`ScannerService._process_items`)
```
for item in items:
  _job_cancelled -> stats["cancelled"] = True ; return
  1. ArchiveEntryRepository.get_by_file_path(db, item.file_path)
       found -> if size/mtime/hash missing: _ensure_file_hash(item) ; ArchiveEntryRepository.update(...) ; continue
  2. _ensure_file_hash(item) -> _compute_file_hash(path)   SHA-256, 1 MiB chunks
     ArchiveEntryRepository.get_by_hash(db, file_hash)
       found -> treat as moved: update file_path/file_size/modified_time ; continue
  3. ArchiveEntryRepository.get_by_title_and_version(db, title, version)
       found -> stats["matched"] += 1 ; continue
  4. MatchingService.match_title(db, title, version)            backend/app/services/matching.py
       exact title+version -> "exact" (cannot happen here: step 3 already skipped it)
       difflib ratio vs ArchiveEntryRepository.list_titles: >= 0.85 "fuzzy", >= 0.70 "developer", else "manual"
     MatchingService.metadata_status_for_match -> PARTIAL (fuzzy/developer) | UNMATCHED (manual)
  5. ArchiveEntryRepository.create(db, {... metadata_status, verification_status: UNKNOWN, library_id, file_size, modified_time, file_hash ...})
```
Gotcha: directory items carry `file_hash=None`, so step 2 calls `_compute_file_hash` on a directory, which raises; the task then records `FAILED` and Celery autoretries.

## 5. Watching progress (frontend)
```
frontend/app/admin/library/page.tsx -> scansApi.getStatus()   GET /api/scan/status
  -> read_scan_status -> JobHistoryRepository.count_by_status(db, [LIBRARY_SCAN, INCREMENTAL_SCAN])
  <- ScanStatus {pending, running, success, failed, canceled, total}
frontend/app/admin/jobs/page.tsx -> jobsApi.getAll(...)  GET /api/jobs/  (polls every 5 s while active)
```
Tasks only write `progress = 100` at the end; there is no intermediate progress.

## 6. After the scan
- Duplicates: `frontend/app/admin/duplicates/page.tsx` -> `archiveApi.getDuplicates()` -> `GET /api/archive-entries/duplicates` -> `ScannerService.find_duplicates(db)` -> `ArchiveEntryRepository.list_with_hashes(db)`, grouped by `file_hash` where count > 1.
- Metadata is not fetched during scans; see `docs/knowledge/flows/metadata.md`.

## Entities
`router:app.api.scan`, `service:app.services.job.JobService`, `service:app.services.scanner.ScannerService`, `service:app.services.matching.MatchingService`, `class:app.services.scanner.ArchiveScanItem`, `task:app.tasks.scan_tasks.scan_full_task`, `task:app.tasks.scan_tasks.scan_incremental_task`, `repo:app.repositories.archive_entry.ArchiveEntryRepository`, `repo:app.repositories.library.LibraryRepository`, `repo:app.repositories.job_history.JobHistoryRepository`, `module:app.utils.normalization`, `table:archive_entries`, `table:libraries`, `table:job_history`, `page:/admin/library`, `apimod:lib/api/scans`.
