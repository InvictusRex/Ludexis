# Domain: Core

Cross-cutting infrastructure: app factory and router registration, settings, DB engine/session, declarative base, generic repository, logging, Prometheus metrics, health checks, migrations, seed scripts, and on the frontend the HTTP client, layout shell, UI primitives and generic libs.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/main.py` | FastAPI app: CORS, router include, `/media`, `/api/metrics`, `/healthz` | `app`, `read_media`, `health_check` |
| `backend/app/api/__init__.py` | Mounts every router under `settings.API_PREFIX` | `api_router` |
| `backend/app/api/health.py` | Router `/health` | `health`, `database_health`, `redis_health` |
| `backend/app/core/config.py` | Pydantic settings | `Settings`, `settings`, `cors_origins_list` |
| `backend/app/core/logging.py` | JSON logging | `setup_logging`, `get_logger`, `LudexisJsonFormatter` |
| `backend/app/core/metrics.py` | Prometheus counters | `auth_login_success_total`, `auth_login_failure_total`, `library_scans_total`, `incremental_scans_total`, `metadata_searches_total`, `artwork_downloads_total`, `artwork_validation_failures_total`, `artwork_deduplications_total`, `artwork_auto_download_runs_total` |
| `backend/app/core/dependencies.py` | DI helpers | `get_metadata_service` |
| `backend/app/db/session.py` | Engine + session | `engine`, `SessionLocal`, `get_db` |
| `backend/app/db/base.py` | Declarative base (+ `pg_trgm` DDL) | `Base` |
| `backend/app/repositories/base.py` | Generic CRUD | `BaseRepository.create`, `get`, `list_items`, `update`, `delete` |
| `backend/app/schemas/base.py` | Shared schema base | `TimestampedModel` |
| `backend/app/models/__init__.py` | Imports every model for metadata | |
| `backend/app/utils/enums.py` | Shared enums | `MetadataStatus`, `VerificationStatus`, `RelationshipType`, `JobType`, `JobStatus`, `PermissionName`, `RoleName` |
| `backend/alembic/env.py`, `backend/alembic/versions/ecabaf1d5dab_baseline_schema.py` | Migrations | `run_migrations_offline`, `run_migrations_online`; revision `ecabaf1d5dab` |
| `backend/scripts/seed_demo.py` | Demo data seed | `seed`, `main`, `write_artwork`, `make_png` |
| `backend/tests/conftest.py` | Test DB setup | `setup_database`, `override_get_db` |
| `frontend/app/layout.tsx` | Root layout | wraps `AuthProvider`, `ErrorBoundary`, `AppWrapper`, `Toaster` |
| `frontend/components/ErrorBoundary.tsx` | Error boundary | `ErrorBoundary` |
| `frontend/components/ui/` | UI primitives (shadcn) | `button`, `card`, `dialog`, `table`, ... |
| `frontend/lib/api/client.ts` | HTTP client | `apiClient.get`, `getList`, `post`, `patch`, `put`, `delete` |
| `frontend/lib/api.ts` | Re-export barrels | all `*Api` objects |
| `frontend/lib/api/health.ts` | API module | `healthApi.getHealth`, `getDb`, `getRedis` |
| `frontend/lib/config.ts` | Env-driven URLs | `config.apiBaseUrl`, `mediaBaseUrl`, `grafanaUrl` |
| `frontend/lib/errors.ts` | Errors | `ApiError`, `getErrorMessage` |
| `frontend/lib/toast.ts`, `frontend/lib/utils.ts` | Toast helpers, class merge | `toastError`, `toastSuccess`, `toastInfo`; `cn` |
|  `frontend/lib/types/health.ts`, `frontend/lib/types/index.ts` | Types | `LoadingState`, `AsyncState`, `Paginated`, `HealthStatus` |
| `backend/tests/test_health.py`,  `backend/tests/test_db.py`, `backend/tests/test_ci_database.py` | Backend tests | |
| `frontend/lib/api/client.test.ts`, `frontend/lib/errors.test.ts`,  `frontend/components/ErrorBoundary.test.tsx` | Frontend tests | |
| `frontend/components/brand/boot-screen.tsx` | Component | `BootScreen` |
| `frontend/components/brand/empty-state.tsx` | Component | `EmptyState` |
| `frontend/components/brand/sparkle-field.tsx` | Component | `SparkleField` |
| `frontend/components/brand/wordmark.tsx` | Component | `Wordmark` |
| `frontend/components/browse/confirm-dialog.tsx` | Component | `ConfirmDialog` |
| `frontend/components/media/shelf.tsx` | Component | `Shelf` |
| `frontend/components/shell/app-shell.tsx` | Component | `AppShell` |
| `frontend/components/shell/nav.tsx` | Component | `AlertDot`, `reviewAlert`, `NavList` |
| `frontend/components/shell/page.tsx` | Component | `Page`, `PageHeader` |
| `frontend/components/shell/sidebar.tsx` | Component | `Sidebar` |
| `frontend/components/shell/topbar.tsx` | Component | `Topbar` |
| `frontend/components/shell/user-menu.tsx` | Component | `UserMenu` |
| `frontend/components/ui/badge.tsx` | Component |  |
| `frontend/components/ui/card.tsx` | Component |  |
| `frontend/components/ui/checkbox.tsx` | Component |  |
| `frontend/components/ui/dialog.tsx` | Component |  |
| `frontend/components/ui/dropdown-menu.tsx` | Component |  |
| `frontend/components/ui/input.tsx` | Component |  |
| `frontend/components/ui/label.tsx` | Component |  |
| `frontend/components/ui/progress.tsx` | Component |  |
| `frontend/components/ui/select.tsx` | Component |  |
| `frontend/components/ui/sheet.tsx` | Component |  |
| `frontend/components/ui/skeleton.tsx` | Component |  |
| `frontend/components/ui/switch.tsx` | Component |  |
| `frontend/components/ui/table.tsx` | Component |  |
| `frontend/components/ui/tabs.tsx` | Component |  |
| `frontend/components/ui/textarea.tsx` | Component |  |
| `frontend/hooks/use-api.ts` | Hook | `useApi` |
| `frontend/app/(app)/layout.tsx` | Layout `/` | `AppLayout` |
| `frontend/lib/format.ts` | Utility | `year`, `formatDate`, `formatBytes`, `plural` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.health`, `router:main` |
| Repository | `repo:app.repositories.base.BaseRepository` |
| Schema | `schema:app.schemas.base.TimestampedModel` |
| Module | `module:main`, `module:app.core.config`, `module:app.core.logging`, `module:app.core.metrics`, `module:app.core.dependencies`, `module:app.db.session`, `module:app.db.base`, `module:app.utils.enums`, `module:scripts.seed_demo` |
| Migration | `migration:ecabaf1d5dab` |
| ExternalProvider | `extprov:Celery` |
| Layout | `layout:/`, `layout:/(app)` |
| Component | `comp:components/ErrorBoundary`, `comp:components/ui/button`, `comp:components/brand/boot-screen`, `comp:components/brand/empty-state`, `comp:components/brand/sparkle-field`, `comp:components/brand/wordmark`, `comp:components/browse/confirm-dialog`, `comp:components/media/shelf`, `comp:components/shell/app-shell`, `comp:components/shell/nav`, `comp:components/shell/page`, `comp:components/shell/sidebar`, `comp:components/shell/topbar`, `comp:components/shell/user-menu`, `comp:components/ui/badge`, `comp:components/ui/card`, `comp:components/ui/checkbox`, `comp:components/ui/dialog`, `comp:components/ui/dropdown-menu`, `comp:components/ui/input`, `comp:components/ui/label`, `comp:components/ui/progress`, `comp:components/ui/select`, `comp:components/ui/sheet`, `comp:components/ui/skeleton`, `comp:components/ui/switch`, `comp:components/ui/table`, `comp:components/ui/tabs`, `comp:components/ui/textarea` |
| ApiModule | `apimod:lib/api/client`, `apimod:lib/api/health` |
| LibUtil | `lib:lib/api`, `lib:lib/config`, `lib:lib/errors`, `lib:lib/toast`, `lib:lib/utils`, `lib:lib/format` |
| TypeModule | `typemod:lib/types/health`, `typemod:lib/types/index` |
| TestFile | `test:backend/tests/test_health.py`, `test:frontend/lib/api/client.test.ts` |
| Hook | `hook:hooks/use-api` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/health/` | `health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getHealth` |
| GET | `/api/health/db` | `database_health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getDb` |
| GET | `/api/health/redis` | `redis_health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getRedis` |
| GET | `/healthz` | `health_check` (`backend/main.py`) | public | none |
| GET | `/api/metrics` | `backend/main.py` (prometheus Instrumentator().expose) | public | none (fetched directly by ) |

## Tables
All 27 tables are created by migration `ecabaf1d5dab` (baseline): 18 model tables plus 9 association tables in `backend/app/models/association_tables.py`.

## Change guide
- New router: add a module under `backend/app/api/` with `APIRouter(prefix="/<name>")` and include it in `backend/app/api/__init__.py` (gets the `/api` prefix automatically).
- New setting: field on `Settings` in `backend/app/core/config.py` (env var of the same name); frontend env values go in `frontend/lib/config.ts` (`NEXT_PUBLIC_*`).
- New table/column: model under `backend/app/models/`, import it in `backend/app/models/__init__.py`, then add a revision in `backend/alembic/versions/`.
- New metric: counter in `backend/app/core/metrics.py`, increment at the call site; it appears on `/api/metrics`.
- New generic HTTP behavior (headers, retries): `fetchWithAuth` in `frontend/lib/api/client.ts`.

## Notes
- CORS: origins from `CORS_ORIGINS` (comma separated, `cors_origins_list`), credentials allowed, `X-Total-Count` exposed.
- `BaseRepository.delete` soft-deletes when the model has `deleted_at` (archive entries, collections, libraries, users) and hard-deletes otherwise; every repository write commits immediately.
- `/healthz` (no prefix) and `GET /api/health/` are both unauthenticated; `GET /api/health/db` and `/api/health/redis` return 503 with details on failure.
- `/api/metrics` is mounted by `prometheus_fastapi_instrumentator`, outside `api_router`; `PrometheusMetricsPanel` derives its URL from `config.apiBaseUrl`.
- `config.apiBaseUrl` defaults to `http://localhost:8000/api` (`NEXT_PUBLIC_API_URL`).
