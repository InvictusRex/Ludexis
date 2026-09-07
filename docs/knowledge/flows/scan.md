# Flow: Library Scan

## Overview
Full and incremental library scanning — discovers new archives, detects changes, and updates the database.

## Full Scan Sequence
```
1. POST /scan/full {library_id}
   -> JobService.start_job("scan_full", user_id)
     -> JobHistoryRepository.create({job_type: "scan_full", status: "pending"})
     -> scan_full_task.delay(job_id, library_id)
     -> AuditService.record("scan.start", ...)
   <- JobHistoryRead {id, job_type: "status": "pending"}

2. scan_full_task executes (Celery worker):
   -> JobService.update_status(job_id, "running")
   -> ScannerService.scan_full(job_id, library_id)
     -> LibraryRepository.get(library_id) -> verify enabled
     -> JobService.update_progress(job_id, 0)
     -> for each file in library.path (recursive):
       -> skip if not archive type (.zip, .rar, .7z, .exe, etc.)
       -> MatchingService.match_title(filename)
         -> normalize title
         -> ArchiveEntryRepository.search(title) -> fuzzy match
       -> if match found:
         -> ArchiveEntryRepository.update(match, {file_path, file_size, ...})
       -> else:
         -> ArchiveEntryRepository.create({
              title, file_path, file_size, file_hash,
              archive_type, library_id, ...
            })
       -> update progress
     -> JobService.update_status(job_id, "success")
     -> AuditService.record("scan.complete", ...)
```

## Incremental Scan Sequence
```
1. POST /scan/incremental {library_id}
   -> JobService.start_job("scan_incremental", user_id)
     -> scan_incremental_task.delay(job_id, library_id)
   <- JobHistoryRead

2. scan_incremental_task executes:
   -> ScannerService.scan_incremental(job_id, library_id)
     -> similar to full scan but:
       -> only processes files modified since last scan
       -> uses file modified_time comparison
```

## Duplicate Detection
```
GET /archive-entries/duplicates
  -> ArchiveEntryService.list_duplicates()
    -> ArchiveEntryRepository.find_duplicates_by_hash()
      -> SELECT file_hash, COUNT(*) FROM archive_entries
         WHERE deleted_at IS NULL
         GROUP BY file_hash HAVING COUNT(*) > 1
    -> group by hash, return DuplicateGroup[]
```

## Entities Involved
- `service:app.services.job.JobService`
- `service:app.services.scanner.ScannerService`
- `service:app.services.matching.MatchingService`
- `repo:app.repositories.archive_entry.ArchiveEntryRepository`
- `repo:app.repositories.library.LibraryRepository`
- `task:app.tasks.scan_tasks.scan_full_task`
- `task:app.tasks.scan_tasks.scan_incremental_task`
- `model:app.models.job_history.JobHistory`
