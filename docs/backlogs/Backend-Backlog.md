# ✅~~Backlog~~

## ✅~~Authentication & Authorization~~

### ✅~~High Priority~~

- ✅~~Fix Swagger OAuth2 integration mismatch (Swagger expects OAuth2 Password Flow form data while backend login endpoint currently accepts JSON payloads).~~
- ✅~~Replace development JWT secret with a generated production-grade secret.~~
- ✅~~Replace all development credentials and example secrets before public releases.~~ (compose stacks read `JWT_SECRET_KEY` and database/Grafana/demo-admin passwords from the environment; the backend refuses JWT secrets shorter than 32 characters; tracked env files hold no secrets)
- ✅~~Review and stabilize bcrypt/passlib dependency versions to prevent compatibility regressions.~~
  - ~~passlib==1.7.4~~
  - ~~bcrypt==4.0.1~~
  - ~~bcrypt >=5.0.0 is incompatible with passlib 1.7.4 and breaks authentication.~~
- ✅~~Add automated integration tests for authentication, token refresh, logout, and authorization flows.~~

### ✅~~Low Priority~~

- ✅~~Improve Swagger authorization experience for protected endpoints.~~
- ✅~~Add token expiration and refresh workflow tests.~~

---

## ✅~~Security & RBAC~~

### ✅~~High Priority~~

- ✅~~Seed default permissions during system initialization.~~
- ✅~~Seed default roles during system initialization.~~
- ✅~~Seed default role-permission mappings during system initialization.~~
- ✅~~Create administrator role automatically during first-time setup.~~
- ✅~~Validate permission enforcement across all protected endpoints.~~

### ✅~~Medium Priority~~

- ✅~~Add permission audit reporting.~~
- ✅~~Expand audit logging coverage for administrative actions.~~

---

## ✅~~Metadata & Enrichment~~

### ✅~~High Priority~~

- ✅~~Implement IGDB provider integration.~~
- ✅~~Implement Steam metadata provider.~~
- ❌~~Implement GOG metadata provider (not planned: its API is less complete than Steam or IGDB and its endpoints keep changing).~~
- ✅~~Implement automatic metadata matching workflow.~~ (runs automatically for new scan entries and nightly for never-attempted entries; IGDB then Steam, title similarity thresholds 0.85/0.70)
- ✅~~Implement metadata refresh jobs.~~
- ✅~~Implement Genre/Developer/Publisher Synchronization.~~

### ✅~~Medium Priority~~

- ✅~~Metadata confidence scoring.~~
- ✅~~Metadata conflict resolution.~~
- ✅~~Multi-provider metadata merging.~~
- ✅~~Manual metadata override workflow.~~

### ✅~~Low Priority~~

- ✅~~IGDB's involved_companies flags mapping involved_companies.company.name into both developers & publishers.~~
- ✅~~Entity normalization, IGDB: The Creative Assembly and Steam: CREATIVE ASSEMBLY.~~

---

## ✅~~Artwork System~~

### ✅~~High Priority~~

- ✅~~Implement artwork download pipeline.~~
- ✅~~Implement artwork validation jobs.~~
- ✅~~Self-healing artwork refresh.~~ (the 04:00 ARTWORK_REFRESH job re-downloads missing or corrupt artwork for provider-matched entries)
- ✅~~Automatic cover selection.~~

### ✅~~Medium Priority~~

- ✅~~Automatic Banner/Logo download.~~
- ✅~~Screenshot importing.~~
- ✅~~Artwork quality scoring.~~
- ✅~~Artwork deduplication.~~
- ✅~~Implement local artwork caching and storage management in dedicated directory.~~

---

## ✅~~Archive Management~~

### ✅~~High Priority~~

- ✅~~Fix `ArchiveEntryRead` serialization inconsistencies.~~
  - ~~Relationship data is returned correctly.~~
  - ~~`tag_ids`~~
  - ~~`developer_ids`~~
  - ~~`publisher_ids`~~
  - ~~`collection_ids`~~
    ~~currently return empty arrays despite valid relationships existing.~~

### ✅~~Medium Priority~~

- ✅~~Improve filename normalization.~~
- ✅~~Improve version detection from filenames.~~
- ✅~~Improve archive naming heuristics.~~
- ✅~~Duplicate archive detection.~~
- ✅~~Multi-library support.~~

---

## ✅~~Scanner & Ingestion~~

### ✅~~Planned~~

- ✅~~File Metadata Foundation.~~
- ✅~~Archive hash generation.~~
- ✅~~Incremental scan optimization.~~
- ✅~~Archive integrity verification.~~
- ✅~~File move/rename detection.~~ (hash match with the old path gone; a second copy gets its own entry)
- ✅~~Scan to metadata to artwork pipeline.~~ (a scan queues an enrichment job for the entries it created)
- ✅~~One entry per game folder.~~ (folders with non-archive files are one entry; organizing folders are descended)
- ✅~~Per-file error isolation and changed-file updates during scans.~~
- ✅~~Filename normalization for real-world release names.~~ (platform/packaging tags, CamelCase, letter-suffixed versions)

### ✅~~Low Priority~~

- ✅~~Reuse hash instead of recalculating at every scan.~~
- ✅~~`get_all_by_hash()` duplicate detection.~~
- ❌~~Parallel scan execution (deferred, not needed unless library size is extremely large, also hardware might bottleneck).~~

---

## ✅~~Background Jobs~~

### ✅~~Planned~~

- ✅~~Job retry policies.~~
- ✅~~Scheduled metadata refreshes.~~
- ✅~~Scheduled artwork validation.~~
- ✅~~Celery Beat for scheduling.~~
- ✅~~Job queue monitoring endpoints.~~
- ✅~~Job cancellation improvements.~~
- ✅~~Live job progress and retry tracking.~~ (shared `run_job` helper; `retry_count` recorded)
- ✅~~Celery beat service in the Docker stacks.~~

---

## ✅~~API & Documentation~~

### ✅~~High Priority~~

- ✅~~Fix Swagger OAuth2 flow compatibility.~~

### ✅~~Medium Priority~~

- ✅~~Improve OpenAPI examples.~~
- ✅~~Expand endpoint documentation.~~
- ✅~~Add API usage guides.~~
- ✅~~Add developer integration examples.~~

---

## ✅~~Infrastructure~~

### ✅~~Medium Priority~~

- ✅~~Move all runtime configuration fully into environment variables.~~
- ✅~~Remove remaining hardcoded development defaults.~~
- ✅~~Review Docker production deployment configuration.~~
- ✅~~Add CI/CD validation pipeline.~~

### ✅~~Low Priority~~

- ✅~~Health check endpoints.~~
- ✅~~Metrics and monitoring integration.~~
- ✅~~Structured logging improvements.~~

---

## ✅~~Testing~~

### ✅~~High Priority~~

- ✅~~Authentication integration tests.~~
- ✅~~RBAC integration tests.~~
- ✅~~Permission enforcement across all protected endpoints.~~
- ✅~~Scanner integration tests.~~
- ✅~~Metadata provider tests.~~
- ✅~~Background job tests.~~
- ✅~~End-to-end API test suite.~~
- ✅~~Screenshots listing endpoint & metadata_confidence persistence tests.~~ (`backend/tests/test_screenshots_api.py`, 7 tests)
- ✅~~Scanner, enrichment, normalization and job-runner tests; tests never dispatch to the real Celery broker.~~ (full suite 165 passed)
- ✅~~Opt-in tests against a real archive folder.~~ (`tests/test_sample_library.py`, set `LUDEXIS_SAMPLE_LIBRARY`)

---

## ✅~~Backend Additions (Latest Wave)~~

- ✅~~`GET /api/archive-entries/{id}/screenshots` endpoint with `ScreenshotRead` schema.~~
- ✅~~`metadata_confidence` field on archive entries, persisted by `auto_match_archive` (`round(score, 3)`, incl. `0.0` on UNMATCHED).~~
- ✅~~`metadata_confidence` column.~~ (part of the single baseline migration `ecabaf1d5dab`; the earlier `4c81f2a9b6d7` revision was folded into it)
- ✅~~Authenticated `/media` route serving the artwork storage dir.~~ (Bearer access token or the httpOnly session cookie)

---

## ✅~~Self-Hosted Service~~

- ✅~~Folder-name parser for VN/Ren'Py releases.~~ (bracket versions, build counters and status noise, DLsite codes, episodes/chapters/parts/seasons, small-word casing)
- ✅~~Group versions of one game and gather episodes into collections.~~ (`GroupingService`; grouped search, versions endpoint; sibling versions share one metadata match)
- ✅~~VNDB metadata provider.~~ (keyless Kana API with back-off; provider order and enablement in settings)
- ✅~~Import tags and franchises from providers.~~ (`tags.origin`; user tags are never removed)
- ✅~~Keep data when a library drive is disconnected.~~ (library `status`, offline skip, reconnect rescan, `relative_path` re-linking)
- ✅~~Scheduled tasks stored in the database and edited in the admin UI.~~ (five-minute beat tick)
- ✅~~Server settings API.~~ (server name, provider order, IGDB credentials)
- ✅~~httpOnly cookie sessions with CSRF header; login rate limiting.~~
- ✅~~Stale-job recovery.~~ (worker restart and age-based sweep)
- ✅~~Artwork auto-download as a background job.~~
- ✅~~Pull-and-run compose stack.~~ (Caddy on one port, GHCR images, generated JWT secret, read-only `/games` mount)

---

## Known Issues

- ✅~~Fix `ArchiveEntryService.update` PATCH semantics.~~ (`PATCH /api/archive-entries/{id}` only changes the fields sent)
- ✅~~`archiveApi.update` partial payloads.~~ (typed `ArchiveEntryUpdate`, used by the Edit Entry dialog)
