# Repository Analysis State

## 1. Repository Overview

**Project**: Ludexis — Self-Hosted Game Archive & Metadata Management Platform

**Purpose**: Catalog, organize, enrich, and preserve large collections of game archives (ZIP, RAR, 7z, installers, visual novels, ROMs, preservation projects) through automated scanning, metadata enrichment (IGDB, Steam, GOG), artwork acquisition, and advanced organization (collections, tags, franchises).

**Tech Stack**:
- **Backend**: Python 3.12+, FastAPI 0.115+, SQLAlchemy 2.0, PostgreSQL 16+, Redis 7+, Celery 5.4+
- **Frontend**: Next.js 16.2.6, React 19, TypeScript 5.7, Tailwind CSS 4.2, Radix UI, shadcn/ui patterns
- **Infrastructure**: Docker Compose, Prometheus, Grafana, Node Exporter
- **Testing**: pytest (backend), Vitest + Playwright (frontend)
- **Auth**: JWT (access + refresh tokens), RBAC, audit logging

**Architecture**: Layered service-oriented
```
Client → API Layer (FastAPI routers) → Service Layer (business logic)
                                    → Repository Layer (data access)
                                    → Database (PostgreSQL)
Background: Redis → Celery Workers → Services/Repositories → PostgreSQL
External: Services/Tasks → Providers (IGDB, Steam, GOG)
Storage: Artwork files on persistent volumes
```

---

## 2. Areas Discovered

### Backend (`backend/`)
| Area | Path | Key Files | Status |
|------|------|-----------|--------|
| **Entry Point** | `main.py` | FastAPI app, CORS, metrics, media serving | ✅ Scanned |
| **API Layer** | `app/api/` | 22 routers (auth, users, libraries, archive_entries, collections, tags, developers, publishers, franchises, artwork, scan, jobs, metadata, search, admin, health, setup, roles, permissions) | ✅ Scanned |
| **Core** | `app/core/` | config, auth, security, dependencies, logging, metrics | ✅ Scanned |
| **Database** | `app/db/` | base, session | ✅ Scanned |
| **Models** | `app/models/` | 18 SQLAlchemy models (User, ArchiveEntry, Library, Collection, Tag, Genre, Developer, Publisher, Franchise, MetadataSource, Screenshot, Note, Rating, JobHistory, AuditLog, RefreshToken, Role, Permission + association tables) | ✅ Scanned |
| **Repositories** | `app/repositories/` | 16 repository classes mirroring models | ✅ Scanned |
| **Schemas** | `app/schemas/` | 21 Pydantic schemas for request/response | ✅ Scanned |
| **Services** | `app/services/` | 16 service classes (Auth, User, ArchiveEntry, Artwork, Metadata, Scanner, Collection, Library, Tag, Developer, Publisher, Franchise, Search, Storage, Job, Audit) | ✅ Scanned |
| **Tasks** | `app/tasks/` | 4 Celery task modules (scan_tasks, artwork_tasks, metadata_tasks, celery_app) | ✅ Scanned |
| **Providers** | `app/providers/` | 5 providers (IGDB, IGDBClient, Steam, GOG, Manual + base MetadataProvider) | ✅ Scanned |
| **Utils** | `app/utils/` | enums, normalization, artwork helpers, audit_actions | ✅ Scanned |
| **Migrations** | `alembic/versions/` | 1 baseline migration (ecabaf1d5dab) | ✅ Scanned |
| **Tests** | `tests/` | pytest structure | ⚠️ Not inspected |
| **Config** | `.env*`, `docker-compose.yml`, `Dockerfile`, `requirements.txt` | Deployment config | ✅ Scanned |

### Frontend (`frontend/`)
| Area | Path | Key Files | Status |
|------|------|-----------|--------|
| **App Router Pages** | `app/` | 15 route groups (library, archive/[id], collections, developers, franchises, publishers, search, tags, account, auth, admin/*) | ✅ Scanned |
| **Components** | `components/` | 60+ components (common/, layout/, ui/) | ✅ Scanned |
| **Hooks** | `hooks/` | 4 custom hooks | ✅ Scanned |
| **Contexts** | `contexts/` | Not yet inspected | ⚠️ Not inspected |
| **Lib/Utilities** | `lib/` | api, auth, mock, types, pagination, saved-searches, errors, toast, media, config | ✅ Scanned |
| **E2E Tests** | `e2e/` | Playwright tests | ⚠️ Not inspected |
| **Config** | `package.json`, `tsconfig.json`, `next.config.mjs`, `vitest.config.ts`, `playwright.config.ts` | Build/test config | ✅ Scanned |

### Documentation (`docs/`)
| Area | Path | Key Files | Status |
|------|------|-----------|--------|
| **Architecture** | `docs/architecture/` | Architecture-Overview.md, Backend-Architecture.md (3182 lines), Data-Model.md (2017 lines), Processing-Pipeline.md (1951 lines), Entity Relation Diagram.png | ✅ Scanned |
| **API** | `docs/api/` | API-Guide.md (1070 lines) | ✅ Scanned |
| **Deployment** | `docs/deployment/` | Deployment.md | ✅ Scanned |
| **Integrations** | `docs/integrations/` | curl.md, javascript.md, python.md | ✅ Scanned |
| **Backlogs** | `docs/backlogs/` | Backend-Backlog.md, Frontend-Backlog.md | ✅ Scanned |
| **Release** | `docs/release/` | RELEASE_NOTES.md | ✅ Scanned |

---

## 3. Existing Documentation Discovered

| Document | Location | Coverage |
|----------|----------|----------|
| Architecture Overview | `docs/architecture/Architecture-Overview.md` | High-level system architecture, goals, components, request lifecycle, auth, RBAC, audit logging, design principles |
| Backend Architecture | `docs/architecture/Backend-Architecture.md` | Layered architecture, request lifecycle, package structure, service layer, major services (Auth, User, ArchiveEntry, Artwork, Metadata, Scanner, Collection, Library, Tag, Developer, Publisher, Franchise, Search, Storage, Job, Audit), repository layer, database, Celery tasks, providers |
| Data Model | `docs/architecture/Data-Model.md` | ER diagrams, IAM tables, library management, metadata domain, collections, relationship tables, background processing, detailed column descriptions |
| Processing Pipeline | `docs/architecture/Processing-Pipeline.md` | Full scan, incremental scan, metadata enrichment, artwork acquisition, job tracking, duplicate detection, scanner internals |
| API Guide | `docs/api/API-Guide.md` | All endpoints with auth, permissions, request/response examples |
| Deployment | `docs/deployment/Deployment.md` | Docker Compose, environment variables, monitoring stack, Windows Exporter |
| Integration Examples | `docs/integrations/` | cURL, Python, JavaScript client examples |
| Backlogs | `docs/backlogs/` | Planned features for backend and frontend |

---

## 4. Areas That Still Need Analysis

| Area | Priority | Notes |
|------|----------|-------|
| **Backend Tests** | High | `backend/tests/` - understand test patterns, coverage |
| **Frontend Contexts** | Medium | `frontend/contexts/` - global state management |
| **Frontend E2E Tests** | Medium | `frontend/e2e/` - Playwright test scenarios |
| **Alembic Migration Details** | Medium | Single baseline migration; understand schema evolution |
| **Service Implementation Details** | High | Deep-dive into each service's public methods, dependencies, job dispatching |
| **Repository Query Patterns** | High | Understand custom query methods beyond CRUD |
| **Provider Implementation** | Medium | IGDB, Steam, GOG client details, error handling, rate limiting |
| **Celery Task Definitions** | High | Task signatures, retry policies, progress tracking |
| **Frontend Component Props/Types** | Medium | TypeScript interfaces, component composition |
| **API Route → Service Mapping** | High | Trace each endpoint to its service method |
| **Database Index Strategy** | Medium | Review all indexes from models and migration |
| **Configuration System** | Low | Pydantic Settings, environment variable mapping |
| **Monitoring/Metrics** | Low | Prometheus metrics exposed, Grafana dashboards |

---

## 5. Proposed Analysis Phases

| Phase | Focus | Deliverables |
|-------|-------|--------------|
| **Phase 1: Foundation** (Current) | Repository structure, existing docs, high-level architecture | `_state.md`, `_schema.md`, `_decisions.md`, `index.md` |
| **Phase 2: Backend Deep-Dive** | Services, repositories, models, schemas, tasks, providers | Entity/relationship extraction for `backend/app/` |
| **Phase 3: Database Schema** | Tables, columns, relationships, indexes, enums, migrations | DB entity graph, migration history |
| **Phase 4: API Surface** | All routes, auth/perm requirements, request/response schemas | API route graph with service bindings |
| **Phase 5: Frontend Deep-Dive** | Pages, components, hooks, contexts, lib utilities | Frontend component graph, page compositions |
| **Phase 6: Cross-Cutting** | Auth flow, RBAC, audit, background jobs, providers, testing | End-to-end flows, integration points |
| **Phase 7: Knowledge Graph Build** | Populate graph per `_schema.md`, create indexes, validation scripts | Queryable knowledge graph in `docs/knowledge/graph/` |

---

## 6. Current Phase / Status

**Phase**: 11 — Graph Repair & Validation Complete

**Completed**:
- ✅ Phase 1: Foundation — Repository structure, existing docs, `_schema.md`, `_decisions.md`, `index.md`, `_state.md`
- ✅ Phase 2a: Services Deep-Dive — All 20 services analyzed
- ✅ Phase 2b: Repositories Deep-Dive — All 17 repositories analyzed
- ✅ Phase 2c: Models Deep-Dive — All 18 models + 9 associations analyzed
- ✅ Phase 2d: Schemas Deep-Dive — All 67 Pydantic schemas analyzed
- ✅ Phase 2e: API Routes Deep-Dive — 20 routers + 87 API routes analyzed
- ✅ Phase 2f: Providers Deep-Dive — 10 provider entities analyzed
- ✅ Phase 2g: Celery Tasks Deep-Dive — 7 task entities analyzed
- ✅ Phase 2h: DB Enums & Tables — 7 DB enums + 27 DB tables analyzed
- ✅ Phase 2i: Relationships — All cross-entity relationships extracted
- ✅ Phase 3: Database Schema — DB enums, DB tables with columns/indexes/FKs
- ✅ Phase 4: API Surface — All routes with auth/perm requirements, request/response schemas
- ✅ Phase 5: Providers — Provider hierarchy, external provider bindings
- ✅ Phase 6: Cross-Layer Relationships — 108 cross-layer flow relationships
- ✅ Phase 7: Domain/Flow Enrichment — 18 domain files + 6 flow diagrams
- ✅ Phase 8: Test Coverage — 20 test files mapped to entities (92 TESTS relationships)
- ✅ Phase 9: Global Audit — All JSONL files validated
- ✅ Phase 10: State/Index Update
- ✅ Phase 11: Graph Repair — Created 19 Domain + 5 Layer entities, fixed 15 broken class: references, deduplicated 32 relationships, full referential-integrity audit passed

**Current Status**: Knowledge graph contains **332 entities** and **861 relationships** (1,193 total graph records). Zero broken references. Zero duplicate relationships.

---

## 7. Explicit TODOs for Next Session

### All Phases Complete — No Immediate TODOs

The knowledge graph is fully built. Future work may include:
- **Frontend extraction**: Pages, components, hooks, contexts, lib utilities
- **Graph query scripts**: CLI tools for traversals under `docs/knowledge/queries/`
- **Visualization**: Generate ER diagrams or dependency graphs from the JSONL data
- **CI integration**: Auto-validate graph consistency on PRs

### Completed Summary

| Phase | Deliverable | Records |
|-------|-------------|---------|
| Phase 1 | Foundation (`_schema.md`, `_decisions.md`, `index.md`, `_state.md`) | 4 files |
| Phase 2a | `entities/backend_services.jsonl` | 20 entities |
| Phase 2b | `entities/backend_repositories.jsonl` | 17 entities |
| Phase 2c | `entities/backend_models.jsonl` | 18 entities |
| Phase 2d | `entities/backend_schemas.jsonl` | 67 entities |
| Phase 2e | `entities/backend_api_routes.jsonl` | 107 entities |
| Phase 2f | `entities/backend_providers.jsonl` | 10 entities |
| Phase 2g | `entities/backend_tasks.jsonl` | 7 entities |
| Phase 2h | `entities/backend_db_enums.jsonl`, `backend_db_tables.jsonl`, `backend_associations.jsonl` | 44 entities |
| Phase 2i | Relationships (7 files) | 893 relationships (pre-repair) |
| Phase 6 | `relationships/backend_cross_layer.jsonl` | 108 relationships |
| Phase 7 | `domains/*.md` (18 files) + `flows/*.md` (6 files) | 24 files |
| Phase 8 | `entities/backend_test_files.jsonl` + `relationships/backend_test_coverage.jsonl` | 20 + 92 records |
| Phase 9 | Global audit | Passed |
| Phase 10 | `_state.md` + `index.md` updated | This update |
| Phase 11 | Graph repair — 24 entities added, 32 duplicates removed, 15 broken refs fixed | 332 entities, 861 relationships |

### Unresolved / Future Considerations

- **Service → Schema dependencies**: Services use Pydantic schemas but these are modeled via Schema entities (not as direct DEPENDS_ON)
- **Celery tasks not unit tested**: Tasks are integration-tested via API endpoints; no direct Celery task unit tests
- **GOG/Manual providers are stubs**: Not implemented beyond search/get_details/download_artwork signatures
- **AdminService reads directly**: bypasses repository layer for 7 tables
- **Frontend not yet extracted**: App Router pages, components, hooks, contexts, lib utilities

---

## Notes

- This state file is the **single source of truth** for analysis progress. Update it at the end of each session.
- Do not rely on conversation memory — all decisions and progress must be persisted here.
- The knowledge graph schema in `_schema.md` is the contract for all future extraction work.