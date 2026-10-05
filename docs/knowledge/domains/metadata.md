# Domain: Metadata

External metadata lookup (IGDB, Steam; GOG and Manual are stubs), automatic matching of scanned entries, merged-detail resolution, and the enrichment job that syncs description, release date, genres, developers and publishers onto matched entries and then fills missing artwork.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/metadata.py` | Router `/metadata` | `search_metadata`, `read_metadata_details`, `read_metadata_artwork` |
| `backend/app/core/dependencies.py` | DI factory | `get_metadata_service` |
| `backend/app/services/metadata.py` | Service | `MetadataService.search`, `get_details`, `download_artwork`, `auto_match`, `auto_match_archive`, `refresh_archive`, `enrich_archive`, `enrichment_candidates`, `get_merged_details`, `_sync_genres`, `_sync_developers`, `_sync_publishers`, `_get_provider`, `_get_providers` |
| `backend/app/services/enrichment.py` | Batch enrichment (matching then artwork) | `EnrichmentService.enrich`, `_job_cancelled` |
| `backend/app/services/metadata_conflict.py` | Merge two provider results | `MetadataConflictResolver.resolve`, `_pick_best_text`, `_merge_unique`, `_merge_companies`, `_normalize_company` |
| `backend/app/providers/metadata_provider.py` | Provider base (ABC) | `MetadataProvider.search`, `get_details`, `download_artwork` |
| `backend/app/providers/igdb.py` | IGDB provider (priority 10) | `IGDBProvider` |
| `backend/app/providers/igdb_client.py` | Twitch OAuth + IGDB HTTP | `IGDBClient.get_headers`, `post`, `_refresh_token`, `_ensure_token` |
| `backend/app/providers/steam.py` | Steam provider (priority 20) | `SteamProvider` |
| `backend/app/providers/gog.py`, `backend/app/providers/manual.py` | Stubs (priority 30, 100) | `GOGProvider`, `ManualProvider` |
| `backend/app/tasks/metadata_tasks.py` | Celery tasks | `refresh_metadata_task` |
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
| Task | `task:app.tasks.metadata_tasks.refresh_metadata_task` |
| Provider | `provider:app.providers.vndb.VNDBProvider` |
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
- Change refresh scope: `MetadataService.enrichment_candidates` (nightly: entries with a provider source, plus entries never attempted); schedule in `celery_app.conf.beat_schedule` (`backend/app/tasks/celery_app.py`).
- Change match thresholds or scoring: `MATCHED_THRESHOLD`, `PARTIAL_THRESHOLD` and `title_similarity` in `backend/app/services/metadata.py`; cases in `backend/tests/test_enrichment.py`.

## Notes
- `MetadataService.search` tries providers in priority order (or `preferred_providers` first) and returns the first provider's non-empty results; provider exceptions are logged and skipped.
- All four providers' `download_artwork` return `None`, so `GET /api/metadata/artwork/...` always returns 404.
- `metadataApi.search` sends `provider_priority` as one comma-joined value; the backend expects repeated params and matches names case-sensitively (`IGDB`, `Steam`, `GOG`, `Manual`), so the hint is ignored.
- `auto_match` searches providers in priority order (IGDB, Steam, ...), scores every candidate with `title_similarity`, stops at the first provider with a score >= 0.85 and otherwise keeps the best candidate across providers.
- `auto_match_archive` always stores `metadata_confidence` and `last_metadata_refresh`; below 0.70 the entry stays UNMATCHED with no provider source, so weak candidates are never used for refreshes. Matched entries are refreshed immediately.
- `refresh_archive` skips entries with `metadata_override` or without a provider source and looks up details by the stored `metadata_source`/`metadata_source_code`; a Steam record is merged only when its title scores >= 0.85.
- New scan entries get a METADATA_REFRESH job for exactly their ids (`_queue_enrichment` in `backend/app/tasks/scan_tasks.py`). Entries attempted and left UNMATCHED are not re-searched nightly; they wait for manual review.
- The `metadata_refresh` scheduled task is skipped by the scheduler tick while a `METADATA_REFRESH` job is already `PENDING`/`RUNNING`, and retried at the next tick.
- `MetadataHistoryCard` / `MetadataAuditTrail` read `GET /api/admin/audit-logs` (requires `VIEW_AUDIT_LOGS`) filtered to `entity="ArchiveEntry"`.
- Auto-matching tries providers in the `provider_order` setting (default `VNDB, IGDB, Steam`; `SettingsService`), stopping at the first match scoring >= 0.85. A provider left out of the list is disabled. Injected providers (tests) are all tried in priority order.
- `VNDBProvider` uses the keyless Kana API with ~1.5 s between requests; after a connection failure it is skipped for 10 minutes so a network that blocks VNDB does not stall matching. Tags: spoiler 0, rating >= 2, top 15; `[url]`/`[b]` markup is stripped from descriptions.
- Before searching, `auto_match_archive` reuses the source of an already matched sibling version (same `group_key`), so every version of a game shares one match.
- `refresh_archive` also syncs tags and franchise: `_sync_tags` replaces only tags with `origin="provider"` (user tags stay), `_sync_franchise` sets `franchise_id` from IGDB franchises/collections only when the entry has none. Steam categories (store features) are not imported as tags.
- IGDB credentials: `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` env vars win, otherwise the values saved under Admin > Settings; without credentials IGDB searches return nothing.
