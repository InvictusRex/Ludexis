# Domain: Scan

Walks every enabled library on disk (one entry per archive file or installed game folder), parses names, updates changed files, detects moves by SHA-256, creates `ArchiveEntry` rows and queues an enrichment job for them. Runs only as Celery tasks queued through `JobService.start_job`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/scan.py` | Router `/scan` | `start_full_scan`, `start_incremental_scan`, `read_scan_status` |
| `backend/app/services/scanner.py` | Scanner service + item dataclass | `ScannerService.scan_full`, `scan_incremental`, `_scan`, `_discover_items`, `_is_game_folder`, `_scan_file`, `_scan_folder`, `_process_item`, `_ingest`, `_needs_processing`, `_ensure_file_hash`, `_compute_file_hash`, `_job_cancelled`, `find_duplicates`, `verify_archives`; `ArchiveScanItem`; `SUPPORTED_ARCHIVE_EXTENSIONS`, `IGNORED_FILE_NAMES`, `ProgressCallback` |
| `backend/app/tasks/scan_tasks.py` | Celery tasks | `scan_full_task`, `scan_incremental_task`, `_queue_enrichment`, `verify_integrity_task`, `detect_duplicates_task` |
| `backend/app/tasks/job_runner.py` | Shared job lifecycle | `run_job`, `summarize`, `JOB_TASK_OPTIONS` |
| `backend/app/utils/normalization.py` | Filename parsing | `parse_archive_name`, `normalize_archive_name`, `ParsedArchive`, `KNOWN_RELEASE_GROUPS`, `KNOWN_FLAGS`, `NOISE_TOKENS` |
| `backend/app/repositories/archive_entry.py` | Persistence | `ArchiveEntryRepository.get_by_file_path`, `get_by_hash`, `get_all_by_hash`, `list_all`, `list_with_hashes` |
| `backend/app/repositories/library.py` | Library roots | `LibraryRepository.list_active` |
| `backend/app/schemas/scan.py` | Schema | `ScanStatus` |
| `backend/app/core/metrics.py` | Counters | `library_scans_total`, `incremental_scans_total` |
| `frontend/app/admin/library/page.tsx` | Full/incremental scan buttons + status | `scansApi.runFull`, `scansApi.runIncremental`, `scansApi.getStatus` |
| `frontend/app/admin/page.tsx` | Dashboard "full scan" action | `scansApi.runFull` |
| `frontend/lib/api/scans.ts` | API module | `scansApi.runFull`, `runIncremental`, `getStatus` |
| `frontend/lib/types/jobs.ts` | Types | `ScanStatus`, `JobHistory` |
| `backend/tests/test_scanner.py`, `backend/tests/test_scan_jobs_api.py`, `backend/tests/test_normalization.py`, `backend/tests/test_sample_library.py`, `backend/tests/test_e2e.py` | Backend tests (`test_sample_library.py` runs only with `LUDEXIS_SAMPLE_LIBRARY` set to a folder of real archives) | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.scan` |
| Service | `service:app.services.scanner.ScannerService`, `service:app.services.job.JobService` |
| Class | `class:app.services.scanner.ArchiveScanItem` |
| Task | `task:app.tasks.scan_tasks.scan_full_task`, `task:app.tasks.scan_tasks.scan_incremental_task` |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository`, `repo:app.repositories.library.LibraryRepository`, `repo:app.repositories.job_history.JobHistoryRepository` |
| Schema | `schema:app.schemas.scan.ScanStatus` |
| Module | `module:app.utils.normalization`, `module:app.core.metrics` |
| Table | `table:archive_entries`, `table:libraries`, `table:job_history` |
| Page | `page:/admin/library`, `page:/admin` |
| ApiModule | `apimod:lib/api/scans` |
| TestFile | `test:backend/tests/test_scanner.py`, `test:backend/tests/test_scan_jobs_api.py`, `test:backend/tests/test_normalization.py`, `test:backend/tests/test_sample_library.py` |

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
- New parsed attribute (e.g. platform): `ParsedArchive` + `parse_archive_name` in `backend/app/utils/normalization.py`, a field on `ArchiveScanItem`, the dict in `ScannerService._ingest`, and the `ArchiveEntry` model/schema/migration (see archive domain).
- New noise word in file names: `NOISE_TOKENS` or `KNOWN_FLAGS` in `backend/app/utils/normalization.py`, with a case in `backend/tests/test_normalization.py`.
- Match thresholds live in the metadata domain (`MATCHED_THRESHOLD`, `PARTIAL_THRESHOLD` in `backend/app/services/metadata.py`).

## Notes
- Discovery: archive files (`.zip .rar .7z .iso .exe`) are one entry each. A directory with any non-archive file (dotfiles, `desktop.ini`, `thumbs.db` ignored) is one `folder` entry and is not descended, so a game's subfolders never become entries. Directories with only archives and subfolders are descended. Unreadable directories are logged and skipped.
- All items are discovered before processing, so `on_progress(done, total)` reports real progress; `run_job` writes it to `job_history.progress`.
- Each item runs inside `_process_item`: an exception rolls back, increments `errors` and the scan continues.
- Dedup order in `_ingest`: same `file_path` (skip if unchanged; otherwise update size/mtime/hash and reset `verification_status` to UNKNOWN) -> same `file_hash` on an entry whose file is gone (move: update path) -> create. A hash match whose old file still exists is a copy and gets its own entry.
- Folder items have `file_hash=None` (`_compute_file_hash` returns `None` for a directory), so they dedupe only by path, and `_verify_archive` reports an existing folder as `VERIFIED`.
- New entries are always `UNMATCHED`; the scan task then queues a METADATA_REFRESH job for `created_ids` (`_queue_enrichment`), recorded as `enrichment_job_id` in the scan result.
- `storage_device` is never written by the scanner.
- `ScannerService.verify_archives` runs from `verify_integrity_task` (`INTEGRITY_VERIFICATION` job); `find_duplicates` runs from `detect_duplicates_task` and `GET /api/archive-entries/duplicates`.
- `GET /api/scan/status` counts `job_history` rows of type `LIBRARY_SCAN` + `INCREMENTAL_SCAN` grouped by status.
