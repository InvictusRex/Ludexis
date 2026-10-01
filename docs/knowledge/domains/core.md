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
| `frontend/components/layout/app-wrapper.tsx`, `frontend/components/layout/header.tsx`, `frontend/components/layout/sidebar.tsx` | Shell | `AppWrapper`, `Header`, `Sidebar` |
| `frontend/components/ErrorBoundary.tsx` | Error boundary | `ErrorBoundary` |
| `frontend/components/ui/` | UI primitives (shadcn) | `button`, `card`, `dialog`, `table`, ... |
| `frontend/lib/api/client.ts` | HTTP client | `apiClient.get`, `getList`, `post`, `patch`, `put`, `delete` |
| `frontend/lib/api.ts`, `frontend/lib/api/index.ts` | Re-export barrels | all `*Api` objects |
| `frontend/lib/api/health.ts` | API module | `healthApi.getHealth`, `getDb`, `getRedis` |
| `frontend/lib/config.ts` | Env-driven URLs | `config.apiBaseUrl`, `mediaBaseUrl`, `grafanaUrl` |
| `frontend/lib/errors.ts` | Errors | `ApiError`, `getErrorMessage` |
| `frontend/lib/pagination.ts` | Paging helpers | `DEFAULT_PAGE_SIZE`, `PAGE_SIZES`, `pageToOffset`, `buildPageQuery`, `hasMore` |
| `frontend/lib/toast.ts`, `frontend/lib/utils.ts` | Toast helpers, class merge | `toastError`, `toastSuccess`, `toastInfo`; `cn` |
| `frontend/lib/types/shared.ts`, `frontend/lib/types/health.ts`, `frontend/lib/types/index.ts` | Types | `LoadingState`, `AsyncState`, `Paginated`, `HealthStatus` |
| `backend/tests/test_health.py`, `backend/tests/test_smoke.py`, `backend/tests/test_db.py`, `backend/tests/test_ci_database.py` | Backend tests | |
| `frontend/lib/api/client.test.ts`, `frontend/lib/errors.test.ts`, `frontend/lib/pagination.test.ts`, `frontend/components/ErrorBoundary.test.tsx`, `frontend/components/common/pagination-controls.test.tsx` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.health`, `router:main` |
| Repository | `repo:app.repositories.base.BaseRepository` |
| Schema | `schema:app.schemas.base.TimestampedModel` |
| Module | `module:main`, `module:app.core.config`, `module:app.core.logging`, `module:app.core.metrics`, `module:app.core.dependencies`, `module:app.db.session`, `module:app.db.base`, `module:app.utils.enums`, `module:scripts.seed_demo`, `module:seed_rbac` |
| Migration | `migration:ecabaf1d5dab` |
| ExternalProvider | `extprov:Celery` |
| Layout | `layout:/` |
| Component | `comp:components/layout/app-wrapper`, `comp:components/layout/header`, `comp:components/layout/sidebar`, `comp:components/ErrorBoundary`, `comp:components/common/pagination-controls`, `comp:components/ui/button` |
| ApiModule | `apimod:lib/api/client`, `apimod:lib/api/health` |
| LibUtil | `lib:lib/api`, `lib:lib/api/index`, `lib:lib/config`, `lib:lib/errors`, `lib:lib/pagination`, `lib:lib/toast`, `lib:lib/utils` |
| TypeModule | `typemod:lib/types/shared`, `typemod:lib/types/health`, `typemod:lib/types/index` |
| TestFile | `test:backend/tests/test_health.py`, `test:backend/tests/test_smoke.py`, `test:frontend/lib/api/client.test.ts` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/health/` | `health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getHealth` |
| GET | `/api/health/db` | `database_health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getDb` |
| GET | `/api/health/redis` | `redis_health` (`backend/app/api/health.py`) | public | `apifn:lib/api/health.healthApi.getRedis` |
| GET | `/healthz` | `health_check` (`backend/main.py`) | public | none |
| GET | `/api/metrics` | `backend/main.py` (prometheus Instrumentator().expose) | public | none (fetched directly by `comp:components/common/prometheus-metrics-panel`) |

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
