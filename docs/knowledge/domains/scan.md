# Domain: Scan

## Overview
Library scanning — discovers new archives, detects changes, runs full/incremental scans, and manages the scan job lifecycle.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.scanner.ScannerService` | ScannerService |
| Service | `service:app.services.matching.MatchingService` | MatchingService |
| Task | `task:app.tasks.scan_tasks.scan_full_task` | scan_full_task |
| Task | `task:app.tasks.scan_tasks.scan_incremental_task` | scan_incremental_task |
| Schema | `schema:app.schemas.scan.ScanStatus` | ScanStatus |

## Related Tables
- `archive_entries` — discovered archives
- `libraries` — configured library roots
- `job_history` — scan job tracking

## Dependencies
- **ScannerService depends on**: ArchiveEntryRepository, LibraryRepository, MatchingService
- **Tasks consume**: ScannerService, JobService

## API Endpoints
- `POST /scan/full` — start full scan
- `POST /scan/incremental` — start incremental scan
- `GET /scan/status` — scan queue status

## Flow
```
API (/scan/full) -> JobService -> dispatches scan_full_task
  -> ScannerService.scan_full(library_id)
    -> LibraryRepository.get(library_id)
    -> walks filesystem
    -> MatchingService.match_title(filename)
    -> ArchiveEntryRepository.create/update(entries)
    -> updates JobHistory progress
```

## Notes
- Full scan: walks entire library directory tree
- Incremental scan: only processes files modified since last scan
- Uses `pathlib` for cross-platform path handling
- Duplicate detection via file hash (SHA-256)
- Job progress tracked in `job_history` table
