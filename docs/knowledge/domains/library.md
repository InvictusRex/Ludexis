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
- The scanner skips libraries with `enabled = False` and paths that do not exist (`ScannerService._discover_items` returns `[]`).
- `path` is resolved by the Celery worker process, so it must exist on the worker host.
