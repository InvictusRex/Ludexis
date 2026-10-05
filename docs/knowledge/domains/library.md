# Domain: Library

Filesystem roots that the scanner walks. Each `Library` has a unique `name` and `path` and an `enabled` flag; scanned entries record `archive_entries.library_id`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/libraries.py` | Router `/libraries` | `list_libraries`, `read_library`, `create_library`, `update_library`, `delete_library` |
| `backend/app/services/library.py` | Service | `LibraryService.list_items`, `get`, `create`, `update`, `delete`, `_ensure_unique` |
| `backend/app/repositories/library.py` | Repository | `LibraryRepository.list_active`, `get_active`, `get_by_name`, `get_by_path` |
| `backend/app/models/library.py` | Model | `Library` |
| `backend/app/schemas/library.py` | Schemas | `LibraryCreate`, `LibraryUpdate`, `LibraryRead` |
| `frontend/app/admin/library/page.tsx` | Library admin page (also triggers scans) | `librariesApi.getAll/create/update/remove`, `scansApi.runFull/runIncremental/getStatus` |
| `frontend/app/admin/settings/page.tsx` | Settings page (read only) | `librariesApi.getAll` |
| `frontend/lib/api/libraries.ts` | API module | `librariesApi` |
| `frontend/lib/types/library.ts` | Types | `LibraryRead`, `LibraryCreate`, `LibraryUpdate` |
| `backend/tests/test_libraries_api.py` | Backend test | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.libraries` |
| Service | `service:app.services.library.LibraryService` |
| Repository | `repo:app.repositories.library.LibraryRepository` |
| Model | `model:app.models.library.Library` |
| Schema | `schema:app.schemas.library.LibraryCreate`, `schema:app.schemas.library.LibraryUpdate`, `schema:app.schemas.library.LibraryRead` |
| Table | `table:libraries` |
| Page | `page:/admin/library`, `page:/admin/settings` |
| ApiModule | `apimod:lib/api/libraries` |
| TypeModule | `typemod:lib/types/library` |
| TestFile | `test:backend/tests/test_libraries_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/libraries/` | `list_libraries` (`backend/app/api/libraries.py`) | authenticated | `apifn:lib/api/libraries.librariesApi.getAll` |
| GET | `/api/libraries/{library_id}` | `read_library` (`backend/app/api/libraries.py`) | authenticated | `apifn:lib/api/libraries.librariesApi.getById` |
| POST | `/api/libraries/` | `create_library` (`backend/app/api/libraries.py`) | ACCESS_ADMIN | `apifn:lib/api/libraries.librariesApi.create` |
| PATCH | `/api/libraries/{library_id}` | `update_library` (`backend/app/api/libraries.py`) | ACCESS_ADMIN | `apifn:lib/api/libraries.librariesApi.update` |
| DELETE | `/api/libraries/{library_id}` | `delete_library` (`backend/app/api/libraries.py`) | ACCESS_ADMIN | `apifn:lib/api/libraries.librariesApi.remove` |

## Tables
`libraries` (soft delete via `deleted_at`), `audit_logs` (`CREATE_LIBRARY` / `UPDATE_LIBRARY` / `DELETE_LIBRARY` via `AuditLogService.log`).

## Change guide
- New library field: `backend/app/models/library.py`, `backend/app/schemas/library.py`, migration in `backend/alembic/versions/`, `frontend/lib/types/library.ts`, form in `frontend/app/admin/library/page.tsx`.
- Per-library scan: `ScannerService.scan_full` / `scan_incremental` iterate `LibraryRepository.list_active`; a library filter needs a new argument there, on `JobService.start_job`, and in the tasks in `backend/app/tasks/scan_tasks.py`.
- Uniqueness rules: `LibraryService._ensure_unique` (raises `ValueError`, mapped to 400 in the router).

## Notes
- Writes require `ACCESS_ADMIN` (not `RUN_SCANS`).
- The scanner skips libraries with `enabled = False`. Before each scan `ScannerService.check_library` sets `status`: `OFFLINE` with `last_error` when the folder is missing or unreadable, or empty while the library still has entries (an unplugged drive behind a Docker bind mount); otherwise `ONLINE` and `last_seen_at`. Offline libraries are skipped and their entries keep all data; the scan result lists them in `offline_libraries`.
- A library that was `OFFLINE` and is reachable again is scanned in full, even by an incremental scan, and listed in `reconnected_libraries`. Integrity verification skips entries of offline libraries, so they never turn `MISSING`.
- After processing, entries of each scanned library whose file is gone become `MISSING`; ones that came back return to `UNKNOWN`. `last_scan_at` is set.
- `archive_entries.relative_path` (posix path below the root) re-links entries when the library is re-pointed or a drive returns under another path: an unknown path whose `(library_id, relative_path)` matches an entry whose old file is gone updates that entry instead of creating one.
- `path` is resolved by the Celery worker process, so it must exist on the worker host.
