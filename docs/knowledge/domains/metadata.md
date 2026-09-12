# Domain: Metadata

External metadata lookup (IGDB, Steam; GOG and Manual are stubs), merged-detail resolution, and the scheduled refresh that syncs description, release date, genres, developers and publishers onto matched archive entries.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/metadata.py` | Router `/metadata` | `search_metadata`, `read_metadata_details`, `read_metadata_artwork` |
| `backend/app/core/dependencies.py` | DI factory | `get_metadata_service` |
| `backend/app/services/metadata.py` | Service | `MetadataService.search`, `get_details`, `download_artwork`, `auto_match`, `auto_match_archive`, `refresh_archive`, `refresh_all`, `get_merged_details`, `_sync_genres`, `_sync_developers`, `_sync_publishers`, `_get_provider`, `_get_providers` |
| `backend/app/services/metadata_conflict.py` | Merge two provider results | `MetadataConflictResolver.resolve`, `_pick_best_text`, `_merge_unique`, `_merge_companies`, `_normalize_company` |
| `backend/app/providers/metadata_provider.py` | Provider base (ABC) | `MetadataProvider.search`, `get_details`, `download_artwork` |
| `backend/app/providers/igdb.py` | IGDB provider (priority 10) | `IGDBProvider` |
| `backend/app/providers/igdb_client.py` | Twitch OAuth + IGDB HTTP | `IGDBClient.get_headers`, `post`, `_refresh_token`, `_ensure_token` |
| `backend/app/providers/steam.py` | Steam provider (priority 20) | `SteamProvider` |
| `backend/app/providers/gog.py`, `backend/app/providers/manual.py` | Stubs (priority 30, 100) | `GOGProvider`, `ManualProvider` |
| `backend/app/tasks/metadata_tasks.py` | Celery tasks | `refresh_metadata_task`, `scheduled_metadata_refresh_task` |
| `backend/app/schemas/metadata.py` | Schemas | `MetadataSearchResult`, `MetadataDetails` |
| `backend/app/models/metadata_source.py` | Model (unused by code) | `MetadataSource` |
| `backend/app/core/config.py` | Settings | `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `IGDB_TOKEN_URL`, `IGDB_API_URL` |
| `frontend/app/admin/metadata/page.tsx` | Metadata review page | `archiveApi.search`, `metadataApi.search`, `archiveApi.updateMetadata` |
| `frontend/components/common/metadata-comparison.tsx` | Component | `MetadataComparison` (`metadataApi.search`) |
| `frontend/components/common/metadata-history-card.tsx`, `frontend/components/common/metadata-audit-trail.tsx` | Components (audit-log backed) | `MetadataHistoryCard`, `MetadataAuditTrail` |
| `frontend/components/common/provider-source-badge.tsx` | Component | `ProviderSourceBadge` |
| `frontend/lib/api/metadata.ts` | API module | `metadataApi.search`, `getDetails`, `getArtwork` |
| `frontend/lib/types/metadata.ts` | Types | `MetadataSearchResult`, `MetadataDetails`, `MetadataReviewItem` |
| `backend/tests/test_metadata.py`, `backend/tests/test_metadata_api.py`, `backend/tests/test_screenshots_api.py` (auto-match confidence) | Backend tests | |
| `frontend/components/common/metadata-comparison.test.tsx`, `frontend/components/common/metadata-history-card.test.tsx`, `frontend/components/common/metadata-audit-trail.test.tsx`, `frontend/components/common/provider-source-badge.test.tsx` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.metadata` |
| Service | `service:app.services.metadata.MetadataService`, `service:app.services.metadata_conflict.MetadataConflictResolver` |
| Provider | `provider:app.providers.metadata_provider.MetadataProvider`, `provider:app.providers.igdb.IGDBProvider`, `provider:app.providers.igdb_client.IGDBClient`, `provider:app.providers.steam.SteamProvider`, `provider:app.providers.gog.GOGProvider`, `provider:app.providers.manual.ManualProvider` |
| ExternalProvider | `extprov:IGDB`, `extprov:Steam`, `extprov:GOG` |
| Task | `task:app.tasks.metadata_tasks.refresh_metadata_task`, `task:app.tasks.metadata_tasks.scheduled_metadata_refresh_task` |
| Repository | `repo:app.repositories.genre.GenreRepository`, `repo:app.repositories.developer.DeveloperRepository`, `repo:app.repositories.publisher.PublisherRepository` |
| Model | `model:app.models.metadata_source.MetadataSource` |
| Schema | `schema:app.schemas.metadata.MetadataSearchResult`, `schema:app.schemas.metadata.MetadataDetails` |
| Module | `module:app.core.dependencies` |
| Table | `table:metadata_sources`, `table:archive_entries`, `table:genres`, `table:developers`, `table:publishers` |
| Page | `page:/admin/metadata` |
| Component | `comp:components/common/metadata-comparison`, `comp:components/common/metadata-history-card`, `comp:components/common/metadata-audit-trail`, `comp:components/common/provider-source-badge` |
| ApiModule | `apimod:lib/api/metadata` |
| TypeModule | `typemod:lib/types/metadata` |
| TestFile | `test:backend/tests/test_metadata.py`, `test:backend/tests/test_metadata_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/metadata/search` | `search_metadata` (`backend/app/api/metadata.py`) | authenticated | `apifn:lib/api/metadata.metadataApi.search` |
| GET | `/api/metadata/details/{provider_name}/{provider_id}` | `read_metadata_details` (`backend/app/api/metadata.py`) | authenticated | `apifn:lib/api/metadata.metadataApi.getDetails` |
| GET | `/api/metadata/artwork/{provider_name}/{provider_id}` | `read_metadata_artwork` (`backend/app/api/metadata.py`) | authenticated | `apifn:lib/api/metadata.metadataApi.getArtwork` |

## Tables
`archive_entries` (description, release_date, last_metadata_refresh, metadata_status/source/confidence), `genres`, `developers`, `publishers`, `archive_entry_genres`, `archive_entry_developers`, `archive_entry_publishers`, `job_history` (refresh job). `metadata_sources` has a model and FK (`archive_entries.metadata_source_id`) but no code reads or writes it.

## Change guide
- New provider: subclass `MetadataProvider` in `backend/app/providers/` (set `name`, `priority`), export it from `backend/app/providers/__init__.py`, add it to the default list in `MetadataService.__init__`.
- New synced field: add it to `MetadataDetails` (`backend/app/schemas/metadata.py`), fill it in the provider `get_details`, merge it in `MetadataConflictResolver.resolve`, write it in `MetadataService.refresh_archive`; mirror in `frontend/lib/types/metadata.ts`.
- Change refresh scope: `MetadataService.refresh_all` (currently only `metadata_status == MATCHED`); schedule in `celery_app.conf.beat_schedule` (`backend/app/tasks/celery_app.py`).
- Run refresh on demand: map `JobType.METADATA_REFRESH` to `refresh_metadata_task` in `JobService._select_task` (today it maps to the `run_job` stub).

## Notes
- `MetadataService.search` tries providers in priority order (or `preferred_providers` first) and returns the first provider's non-empty results; provider exceptions are logged and skipped.
- All four providers' `download_artwork` return `None`, so `GET /api/metadata/artwork/...` always returns 404.
- `metadataApi.search` sends `provider_priority` as one comma-joined value; the backend expects repeated params and matches names case-sensitively (`IGDB`, `Steam`, `GOG`, `Manual`), so the hint is ignored.
- `refresh_archive` skips entries with `metadata_override` or without `metadata_source`/`metadata_source_code`, then calls `get_merged_details(archive.title)`, which re-matches by title (`auto_match` prefers IGDB) and merges with the top Steam search hit; the stored `metadata_source_code` is not used for the lookup.
- `auto_match_archive` (the only automatic path that sets `metadata_source`/`metadata_confidence`) is called only from tests. The scanner stores `metadata_source=None` and never produces `MATCHED`, so the scheduled refresh only touches entries whose status and source were set through `POST`/`PATCH /api/archive-entries/...`.
- `scheduled_metadata_refresh_task` skips if a `METADATA_REFRESH` job is already `PENDING`/`RUNNING`.
- In `refresh_metadata_task`, `job` is first assigned inside `try`; if `job_repo.get` raises, the `except` block references an unbound `job`.
- `MetadataHistoryCard` / `MetadataAuditTrail` read `GET /api/admin/audit-logs` (requires `VIEW_AUDIT_LOGS`) filtered to `entity="ArchiveEntry"`.
