# Domain: Artwork

Cover, banner, logo and screenshot files for archive entries: multipart upload/replace/delete, missing-artwork listing, synchronous auto-download from provider URLs, filling missing artwork after metadata matches, and scheduled validation with repair. Files live under `settings.ARTWORK_STORAGE_PATH` (via `StorageService`) and are served by `GET /media/{path:path}`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/artwork.py` | Router `/artwork` | `upload_artwork`, `replace_artwork`, `delete_artwork`, `list_missing_artwork`, `auto_download_missing_artwork` |
| `backend/app/services/artwork.py` | Service | `ArtworkService.upload_artwork`, `replace_artwork`, `delete_artwork`, `list_missing_artwork`, `auto_download_missing_artwork`, `auto_download_cover`, `auto_download_banner`, `auto_download_logo`, `auto_download_screenshots`, `fill_missing_artwork`, `_entry_details`, `validate_all_artwork`, `validate_and_redownload_artwork`, `find_duplicate_artwork`, `deduplicate_artwork`, `garbage_collect_artwork`, `_read_file`, `_download_artwork_url`, `_select_best_url`, `_score_artwork_candidate`, `_score_image`, `_file_sha256`, `_canonical_artwork_path`, `_download_screenshots` |
| `backend/app/utils/artwork.py` | Helpers | `ArtworkType`, `build_artwork_relative_path`, `is_allowed_artwork_mime_type` |
| `backend/app/services/storage.py` | File I/O (storage domain) | `StorageService.save`, `delete`, `exists`, `absolute_path` |
| `backend/app/repositories/screenshot.py` | Repository | `ScreenshotRepository.get`, `list_by_entry` |
| `backend/app/models/screenshot.py` | Model | `Screenshot` |
| `backend/app/schemas/artwork.py` | Schemas | `ArtworkUploadResponse`, `ArtworkReplaceResponse`, `ArtworkDeleteResponse`, `ArtworkMissingResponse`, `ArtworkValidationResult` |
| `backend/app/schemas/screenshot.py` | Schema | `ScreenshotRead` |
| `backend/app/tasks/artwork_tasks.py` | Celery tasks | `validate_artwork_task` (mode `validate` or `fill`) |
| `backend/app/core/config.py` | Settings | `ARTWORK_STORAGE_PATH`, `MAX_ARTWORK_SIZE_MB`, `ALLOWED_ARTWORK_MIME_TYPES` |
| `backend/app/core/metrics.py` | Counters | `artwork_downloads_total`, `artwork_validation_failures_total`, `artwork_deduplications_total`, `artwork_auto_download_runs_total` |
| `frontend/app/admin/artwork/page.tsx` | Artwork admin page | `artworkApi.getMissing`, `artworkApi.autoDownload`, `artworkApi.upload`, `archiveApi.getById` |
| `frontend/app/archive/[id]/page.tsx` | Entry detail (artwork widgets) | renders `ScreenshotGallery`, `ArtworkComparisonDialog`, `ArtworkQualityIndicators`, `ArtworkVersionHistory` |
| `frontend/components/common/artwork-management-dialog.tsx` | Component | `ArtworkManagementDialog` (`artworkApi.upload/replace/remove`) |
| `frontend/components/common/screenshot-gallery.tsx` | Component | `ScreenshotGallery` (`archiveApi.getScreenshots`, `artworkApi.upload/remove`) |
| `frontend/components/common/artwork-comparison-dialog.tsx` | Component | `ArtworkComparisonDialog`, `buildArtworkOptions` |
| `frontend/components/common/artwork-quality-indicators.tsx` | Component | `ArtworkQualityIndicators`, `buildQualityChecks` |
| `frontend/components/common/artwork-version-history.tsx` | Component (audit-log backed) | `ArtworkVersionHistory` |
| `frontend/lib/api/artwork.ts` | API module (multipart via own `fetch`) | `artworkApi.getMissing`, `upload`, `replace`, `remove`, `autoDownload`; `multipartRequest` |
| `frontend/lib/media.ts` | Media URL builder | `mediaUrl` |
| `frontend/lib/types/artwork.ts` | Types | `ArtworkType`, `ArtworkMissingItem`, `ArtworkUploadResponse`, `ArtworkReplaceResponse`, `ArtworkDeleteResponse` |
| `backend/tests/test_artwork_api.py`, `backend/tests/test_screenshots_api.py` | Backend tests | |
| `frontend/components/common/artwork-management-dialog.test.tsx`, `frontend/components/common/screenshot-gallery.test.tsx`, `frontend/components/common/artwork-comparison-dialog.test.tsx`, `frontend/components/common/artwork-quality-indicators.test.tsx`, `frontend/components/common/artwork-version-history.test.tsx` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.artwork` |
| Service | `service:app.services.artwork.ArtworkService`, `service:app.services.storage.StorageService` |
| Repository | `repo:app.repositories.screenshot.ScreenshotRepository`, `repo:app.repositories.archive_entry.ArchiveEntryRepository` |
| Model | `model:app.models.screenshot.Screenshot` |
| Schema | `schema:app.schemas.artwork.ArtworkUploadResponse`, `schema:app.schemas.artwork.ArtworkReplaceResponse`, `schema:app.schemas.artwork.ArtworkDeleteResponse`, `schema:app.schemas.artwork.ArtworkMissingResponse`, `schema:app.schemas.screenshot.ScreenshotRead` |
| Task | `task:app.tasks.artwork_tasks.validate_artwork_task` |
| Module | `module:app.utils.artwork` |
| Table | `table:screenshots`, `table:archive_entries` |
| Page | `page:/admin/artwork`, `page:/archive/[id]` |
| Component | `comp:components/common/artwork-management-dialog`, `comp:components/common/screenshot-gallery`, `comp:components/common/artwork-comparison-dialog`, `comp:components/common/artwork-quality-indicators`, `comp:components/common/artwork-version-history` |
| ApiModule | `apimod:lib/api/artwork` |
| LibUtil | `lib:lib/media` |
| TypeModule | `typemod:lib/types/artwork` |
| TestFile | `test:backend/tests/test_artwork_api.py`, `test:backend/tests/test_screenshots_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| POST | `/api/artwork/upload` | `upload_artwork` (`backend/app/api/artwork.py`) | EDIT_METADATA | `apifn:lib/api/artwork.artworkApi.upload` |
| PATCH | `/api/artwork/replace` | `replace_artwork` (`backend/app/api/artwork.py`) | EDIT_METADATA | `apifn:lib/api/artwork.artworkApi.replace` |
| DELETE | `/api/artwork/{artwork_id}` | `delete_artwork` (`backend/app/api/artwork.py`) | EDIT_METADATA | `apifn:lib/api/artwork.artworkApi.remove` |
| GET | `/api/artwork/missing` | `list_missing_artwork` (`backend/app/api/artwork.py`) | authenticated | `apifn:lib/api/artwork.artworkApi.getMissing` |
| POST | `/api/artwork/auto-download` | `auto_download_missing_artwork` (`backend/app/api/artwork.py`) | EDIT_METADATA | `apifn:lib/api/artwork.artworkApi.autoDownload` |

Related: `GET /api/archive-entries/{archive_entry_id}/screenshots` (archive router) lists screenshots; `GET /media/{path:path}` (storage) serves the files.

## Tables
`archive_entries` (`cover_path`, `banner_path`, `logo_path`), `screenshots`, `job_history` (ARTWORK_REFRESH job), `audit_logs` (artwork routes).

## Storage paths (relative to `ARTWORK_STORAGE_PATH`)
| Origin | Path |
|---|---|
| Upload / replace (`build_artwork_relative_path`) | `{entry_id}/{artwork_type}/{uuid4hex}{ext}` (ext lowercased from the upload filename, default `.png`) |
| Auto-download cover / banner / logo | `covers/{entry_id}{ext}`, `banners/{entry_id}{ext}`, `logos/{entry_id}{ext}` |
| Auto-download screenshots | `screenshots/{entry_id}_{n}{ext}` |
| Deduplicated assets | `dedup/{asset_type}/{sha256}.jpg` |

## Change guide
- New artwork type: add a member to `ArtworkType` (`backend/app/utils/artwork.py`), a `<type>_path` column on `ArchiveEntry` + migration (the service resolves the column as `f"{artwork_type.value}_path"`), `ArtworkType` in `frontend/lib/types/artwork.ts`, and the UI in `frontend/components/common/artwork-management-dialog.tsx`.
- Change size/MIME limits: `MAX_ARTWORK_SIZE_MB`, `ALLOWED_ARTWORK_MIME_TYPES` in `backend/app/core/config.py` (enforced by `_read_file` and `_download_artwork_url`).
- Change candidate ranking for auto-download: `_score_artwork_candidate` (URL heuristics) and `_score_image` in `backend/app/services/artwork.py`.
- Move auto-download off the request thread: wrap `ArtworkService.auto_download_missing_artwork` in a task in `backend/app/tasks/artwork_tasks.py` and dispatch it from the route.

## Notes
- `POST /api/artwork/auto-download` runs synchronously inside the HTTP request; for every active entry it may call providers (`MetadataService.get_merged_details`) and download images. Enrichment and the ARTWORK_REFRESH job use `fill_missing_artwork` instead, in the worker.
- Uploads are validated for non-empty content, MIME type in `ALLOWED_ARTWORK_MIME_TYPES`, and size <= `MAX_ARTWORK_SIZE_MB` (10). `ValueError` maps to 400 (upload/replace) or 404 (delete).
- `DELETE /api/artwork/{artwork_id}`: with `artwork_type` cover/banner/logo, `artwork_id` is the archive entry id; without it (or with `screenshot`) it is a screenshot id.
- Dedup uses exact SHA-256 file hashes (`_file_sha256`), not perceptual hashing. `find_duplicate_artwork`, `deduplicate_artwork` and `garbage_collect_artwork` have no route or task callers.
- `garbage_collect_artwork` only scans `covers/`, `banners/`, `logos/`; uploaded files under `{entry_id}/...` are never collected.
- `validate_and_redownload_artwork` (the `artwork_validation` scheduled task, daily 04:00 server time by default, or `JobType.ARTWORK_REFRESH`) runs `validate_all_artwork` (Pillow check of cover/banner/logo; returns per-entry `missing_types`, `corrupt_types`, `complete`) and repairs broken assets for provider-matched entries. It never writes `verification_status`, which belongs to the archive file.
- Upload, replace and delete record `UPLOAD_ARTWORK`, `REPLACE_ARTWORK`, `DELETE_ARTWORK` audit entries with `entity="ArchiveEntry"`, so `ArtworkVersionHistory` shows them; auto-download records `AUTO_DOWNLOAD_ARTWORK` with `entity="Artwork"`.
- `artworkApi.upload`/`replace` bypass `apiClient` (multipart), so they get no 401 refresh retry and throw plain `Error` instead of `ApiError`.
- `POST /api/artwork/auto-download` queues an `ARTWORK_REFRESH` job with `mode="fill"` (`auto_download_missing_artwork` in the worker) and returns the job (202); a running artwork job is returned instead of starting a second one.
