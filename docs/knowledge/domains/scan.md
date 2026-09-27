# Domain: Scan

Walks every enabled library on disk, parses archive names, deduplicates by path / SHA-256 / title+version, and creates `ArchiveEntry` rows. Runs only as Celery tasks queued through `JobService.start_job`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/scan.py` | Router `/scan` | `start_full_scan`, `start_incremental_scan`, `read_scan_status` |
| `backend/app/services/scanner.py` | Scanner service + item dataclass | `ScannerService.scan_full`, `scan_incremental`, `_discover_items`, `_scan_file`, `_scan_folder`, `_process_items`, `_needs_processing`, `_ensure_file_hash`, `_compute_file_hash`, `_job_cancelled`, `find_duplicates`, `verify_archives`; `ArchiveScanItem`; `SUPPORTED_ARCHIVE_EXTENSIONS` |
| `backend/app/services/matching.py` | Title matching against existing entries | `MatchingService.match_title`, `metadata_status_for_match` |
| `backend/app/tasks/scan_tasks.py` | Celery tasks | `scan_full_task`, `scan_incremental_task` |
| `backend/app/utils/normalization.py` | Filename parsing | `parse_archive_name`, `normalize_archive_name`, `ParsedArchive`, `KNOWN_RELEASE_GROUPS` |
| `backend/app/repositories/archive_entry.py` | Persistence | `ArchiveEntryRepository.get_by_file_path`, `get_by_hash`, `get_by_title_and_version`, `list_titles`, `list_all`, `list_with_hashes` |
| `backend/app/repositories/library.py` | Library roots | `LibraryRepository.list_active` |
| `backend/app/schemas/scan.py` | Schema | `ScanStatus` |
| `backend/app/core/metrics.py` | Counters | `library_scans_total`, `incremental_scans_total` |
| `frontend/app/admin/library/page.tsx` | Full/incremental scan buttons + status | `scansApi.runFull`, `scansApi.runIncremental`, `scansApi.getStatus` |
| `frontend/app/admin/page.tsx` | Dashboard "full scan" action | `scansApi.runFull` |
| `frontend/lib/api/scans.ts` | API module | `scansApi.runFull`, `runIncremental`, `getStatus` |
| `frontend/lib/types/jobs.ts` | Types | `ScanStatus`, `JobHistory` |
| `backend/tests/test_scanner.py`, `backend/tests/test_scan_jobs_api.py`, `backend/tests/test_e2e.py` | Backend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.scan` |
| Service | `service:app.services.scanner.ScannerService`, `service:app.services.matching.MatchingService` |
| Class | `class:app.services.scanner.ArchiveScanItem` |
| Task | `task:app.tasks.scan_tasks.scan_full_task`, `task:app.tasks.scan_tasks.scan_incremental_task` |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository`, `repo:app.repositories.library.LibraryRepository`, `repo:app.repositories.job_history.JobHistoryRepository` |
| Schema | `schema:app.schemas.scan.ScanStatus` |
| Module | `module:app.utils.normalization`, `module:app.core.metrics` |
| Table | `table:archive_entries`, `table:libraries`, `table:job_history` |
| Page | `page:/admin/library`, `page:/admin` |
| ApiModule | `apimod:lib/api/scans` |
| TestFile | `test:backend/tests/test_scanner.py`, `test:backend/tests/test_scan_jobs_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| POST | `/api/scan/full` | `start_full_scan` (`backend/app/api/scan.py`) | RUN_SCANS | `apifn:lib/api/scans.scansApi.runFull` |
| POST | `/api/scan/incremental` | `start_incremental_scan` (`backend/app/api/scan.py`) | RUN_SCANS | `apifn:lib/api/scans.scansApi.runIncremental` |
| GET | `/api/scan/status` | `read_scan_status` (`backend/app/api/scan.py`) | authenticated | `apifn:lib/api/scans.scansApi.getStatus` |

## Tables
`archive_entries` (insert/update), `libraries` (read), `job_history` (status written by the tasks; cancel flag polled by `_job_cancelled`), `audit_logs` (`RUN_FULL_SCAN` / `RUN_INCREMENTAL_SCAN`).

## Change guide
- New archive extension: `SUPPORTED_ARCHIVE_EXTENSIONS` in `backend/app/services/scanner.py`.
- New parsed attribute (e.g. platform): `ParsedArchive` + `parse_archive_name` in `backend/app/utils/normalization.py`, a field on `ArchiveScanItem`, the dict in `ScannerService._process_items`, and the `ArchiveEntry` model/schema/migration (see archive domain).
- Change match thresholds: `MatchingService.match_title` (0.85 fuzzy, 0.70 "developer") and `metadata_status_for_match`.
- Scan progress reporting: tasks only set `progress = 100` at the end; per-item progress would go in `ScannerService._process_items` (it already receives `job_id`).

## Notes
- `_discover_items` uses `rglob("*")`: files with an extension in `{.zip, .rar, .7z, .iso, .exe}` become file items, and every sub-directory becomes a `folder` item.
- Folder items have `file_hash=None`: `_compute_file_hash` returns `None` for a directory, so folders are never hash-deduplicated and `_verify_archive` reports an existing folder as `VERIFIED`. Nested directories inside a game folder (for example `Game/bin`) also become their own `folder` entries.
- Dedup order in `_process_items`: same `file_path` (backfill size/mtime/hash, skip) -> same `file_hash` (treat as moved file, update path) -> same title+version (count as `matched`, skip) -> create.
- Because exact title+version matches are skipped first, `MatchingService.match_title` never returns `exact` for new items: scanner-created entries are `PARTIAL` (fuzzy >= 0.70 against existing titles) or `UNMATCHED`. The scanner does not call `MetadataService`.
- Incremental scan only processes items whose path is new or whose `file_size`/`modified_time` changed (`_needs_processing`).
- `ScannerService.verify_archives` runs from `verify_integrity_task` (`INTEGRITY_VERIFICATION` job); `find_duplicates` runs from `detect_duplicates_task` and `GET /api/archive-entries/duplicates`.
- `GET /api/scan/status` counts `job_history` rows of type `LIBRARY_SCAN` + `INCREMENTAL_SCAN` grouped by status.
