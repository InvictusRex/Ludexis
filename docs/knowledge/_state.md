# Knowledge Graph State

Status, coverage, known gaps, and findings. Update at the end of every change to the graph.

| | |
|-|-|
| Graph version | v2 (schema in `_schema.md`) |
| Verified at commit | `e197525` |
| Last verified | 2026-10-01 |
| Validator | `python docs/knowledge/queries/validate.py`, must exit 0 |
| Size | 718 entities, 3,416 relationships |

---

## Project Summary

**Ludexis** is a self-hosted catalog for game archives (ZIP, RAR, 7z, installers, ROMs). It scans library folders, detects duplicates by hash, enriches entries with metadata from IGDB and Steam, manages artwork, and organizes entries into collections, tags, developers, publishers, and franchises. Access is controlled by JWT auth with RBAC and audit logging.

| Part | Stack |
|------|-------|
| Backend | Python, FastAPI 0.111, SQLAlchemy 2.0, Pydantic 2.8, Celery 5.4, PostgreSQL 16, Redis |
| Frontend | Next.js 16.2, React 19, TypeScript 5.7, Tailwind 4, Radix/shadcn UI |
| Tests | pytest (backend), Vitest and Playwright (frontend) |
| Infra | Docker Compose (dev, demo, monitoring), Prometheus, Grafana, GitHub Actions backend CI |

Recent work (from git history): frontend-to-backend integration (real API client, auth flow, admin pages gated on superuser), server-side search and pagination with entry counts, hash-based duplicate detection, auth on the media route, CORS fixes.

---

## Coverage

| Area | In graph | Notes |
|------|----------|-------|
| Backend routers and routes | Yes | 20 routers + `main.py`; 90 routes with `full_path`, permissions, request/response schemas |
| Services, repositories, models, schemas, providers | Yes | Public methods and line ranges verified |
| Celery tasks and beat schedule | Yes | |
| Database tables, columns, enums, migration | Yes | Association tables are `DBTable` with `is_association` |
| `app/core`, `app/utils`, `app/db`, `main.py`, seed scripts | Yes | File-level `Module` entities |
| Frontend pages, layout, components, hooks, context | Yes | Auth guard per page, render tree, API calls |
| Frontend API client layer | Yes | Every API function mapped to its backend route |
| Frontend types | Yes | `MIRRORS` edges to backend schemas with field mismatches |
| Tests | Yes, file level | 20 backend, 44 frontend test files with `TESTS` edges |
| Docker, Compose, monitoring, CI config | No | See `docs/deployment/Deployment.md` |
| Individual settings fields usage | No | Fields listed on `module:app.core.config`; use grep for usage (ADR-013) |
| CSS, static assets, `components.json` | No | Not useful for navigation |

---

## Findings in the Code

These surfaced while the graph was built. They are recorded here, not fixed (ADR-017). Fixed findings move to the change log.

### Bugs

| Finding | Where |
|---------|-------|
| A job left RUNNING by a killed worker stays RUNNING; there is no stale-job recovery. | `backend/app/tasks/job_runner.py` |
| `POST /api/artwork/auto-download` runs provider lookups and downloads for every active entry inside the HTTP request. | `backend/app/api/artwork.py` |
| Artwork `upload` and `replace` use a raw multipart `fetch` instead of `apiClient`, so they do not refresh an expired token on 401 and throw a plain `Error` instead of `ApiError`. | `frontend/lib/api/artwork.ts` |

### Integration gaps

- `/api` routes with no frontend caller: `POST /auth/token` (OAuth2 form login for tooling) and `POST /archive-entries/` (entries are created by scans).
- The frontend `ArchiveEntry` type omits the backend's nested `tags`, `developers`, `publishers`, `collections` and uses only the `*_ids` fields.

### Dead code and duplication

- Unused backend schemas: `ArtworkValidationResult`, `TokenPayload`, `JobStartRequest`.
- The `franchise_entries` table is created by the migration and imported in `models/archive_entry.py`, but no ORM relationship uses it.
- `PermissionName` and `RoleName` enums are not used by any column (permission and role names are stored as strings).

### Stubs

- `GOGProvider` and `ManualProvider` return empty results; only IGDB and Steam provide metadata. GOG integration is not planned.
- `archive_entries.storage_device` is never written.

### Repository hygiene

- The Celery beat schedule files (`backend/celerybeat-schedule.bak`, `.dat`, `.dir`) are runtime state that was tracked in git; the `.gitignore` entry `celerybeat-schedule` did not match the extensions. Fixed: pattern is now `celerybeat-schedule*` and the files are untracked.

---

## Known Limits of the Graph

- `FLOWS_TO` edges are derived (route -> service -> repository/table) and marked `inferred`.
- `TESTS` edges for backend API tests come from the routes and classes the tests exercise, so some are indirect.
- Delegating frontend API functions (for example `searchApi.search`, `*.getEntries`) have `inferred` `CALLS_ENDPOINT` edges to the routes reached through the functions they call.
- Line numbers are exact at the verified commit; after code changes rely on the validator's staleness warning.

---

## Maintenance Procedure

1. Change code.
2. Update the affected records in the matching `graph/*.jsonl` files and domain/flow docs; set `last_verified_at` and `commit_hash`.
3. Run `validate.py` until it exits 0.
4. Update the counts in `index.md` from `validate.py --stats-json` and the table at the top of this file.

## Change Log

| Date | Change |
|------|--------|
| 2026-09-07 | v1: backend-only graph (332 entities, 861 relationships) |
| 2026-09-12 | v2: audit against code. Fixed wrong and missing backend edges (task consumers, route-to-service calls, provider dependency), merged duplicate association tables, corrected domain membership, added route `full_path`, request/response schema edges, core/utils modules, migration. Added the full frontend graph (pages, components, hooks, context, API client mapped to backend routes, types mirrored to schemas, tests). Rewrote domain and flow docs from code (removed non-existent method names and wrong storage and hashing claims). Added `validate.py` and `kg.py`. Removed em dashes and mojibake. |
| 2026-09-27 | Bug fixes `741aaac`..`8220f90`: password reset field, folder hashing in scans, real tasks for `METADATA_REFRESH`/`DUPLICATE_DETECTION`/`INTEGRITY_VERIFICATION` (`run_job` removed; `verify_integrity_task`, `detect_duplicates_task` added), partial `PATCH` for archive entries, `/media` token via query parameter, setup page wired to `setupApi`. Graph and docs patched. |
| 2026-10-01 | Pipeline and release work: one entry per game folder, per-file scan errors, changed-file updates, move/copy handling, real progress and `retry_count` through the shared `run_job` (`backend/app/tasks/job_runner.py`); scans queue an enrichment job (`EnrichmentService`) that auto-matches across IGDB and Steam (`title_similarity`, 0.85/0.70) and fills missing artwork; nightly refresh covers never-attempted entries; artwork job repairs instead of touching `verification_status`; scoped media tokens replace access tokens in `/media` URLs; `AuditLogService` and `MatchingService` removed and audit gaps filled; taxonomy CRUD UI (`TaxonomyFormDialog`); unused UI primitives and hooks removed; Celery beat in both Compose stacks. Fixed findings removed from this file. Graph and docs patched. |
