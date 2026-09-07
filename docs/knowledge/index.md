# Ludexis Knowledge Graph Index

> **Persistent knowledge representation for the Ludexis codebase.**  
> This directory contains a structured, queryable index of the repository's architecture, code entities, relationships, and design decisions — enabling fast onboarding and analysis across sessions.

---

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [`_state.md`](_state.md) | **Current analysis state** — what's been discovered, what remains, phase status, next TODOs |
| [`_schema.md`](_schema.md) | **Graph schema definition** — entity types, relationship types, properties, storage format |
| [`_decisions.md`](_decisions.md) | **Architectural decision log** — ADRs with context, alternatives, consequences |
| [`graph/`](graph/) | **Extracted graph data** — JSONL entities/relationships (332 entities, 861 relationships) |
| [`domains/`](domains/) | **Domain definitions** — 19 domain IDs (18 files) describing business areas |
| [`flows/`](flows/) | **Flow diagrams** — 6 end-to-end flow descriptions |
| [`queries/`](queries/) | **Query scripts** — CLI tools for common graph traversals (planned) |

---

## Repository at a Glance

```
Ludexis/
├── backend/                 # FastAPI + SQLAlchemy + Celery
│   ├── app/
│   │   ├── api/            # 22 API routers
│   │   ├── core/           # Config, auth, security, deps
│   │   ├── db/             # Base, session
│   │   ├── models/         # 18 SQLAlchemy models
│   │   ├── repositories/   # 16 data access classes
│   │   ├── schemas/        # 21 Pydantic schemas
│   │   ├── services/       # 16 business logic services
│   │   ├── tasks/          # 4 Celery task modules
│   │   ├── providers/      # 5 metadata providers (IGDB, Steam, GOG)
│   │   └── utils/          # Enums, normalization, helpers
│   ├── alembic/            # Database migrations
│   └── tests/              # Pytest suite
│
├── frontend/                # Next.js 16 + React 19 + TypeScript
│   ├── app/                # App Router pages (15 route groups)
│   ├── components/         # 60+ components (common, layout, ui)
│   ├── hooks/              # 4 custom hooks
│   ├── contexts/           # React contexts
│   ├── lib/                # API client, auth, types, utilities
│   └── e2e/                # Playwright tests
│
├── docs/                    # Project documentation
│   ├── architecture/       # 4 major architecture docs
│   ├── api/                # API reference guide
│   ├── deployment/         # Deployment guide
│   ├── integrations/       # Client examples
│   └── backlogs/           # Feature backlogs
│
└── docs/knowledge/         # ← THIS DIRECTORY (knowledge graph)
    ├── _schema.md          # Graph schema definition
    ├── _state.md           # Current analysis state
    ├── _decisions.md       # Architectural decision log
    ├── index.md            # ← THIS FILE (navigation)
    ├── graph/
    │   ├── entities/       # 13 JSONL files (332 entities)
    │   └── relationships/  # 9 JSONL files (861 relationships)
    ├── domains/            # 18 domain definition files
    └── flows/              # 6 end-to-end flow diagrams
```

---

## Key Architectural Concepts

| Concept | Description |
|---------|-------------|
| **Archive Entry** | Core entity — a discovered game archive (ZIP, RAR, 7z, installer, etc.) |
| **Library** | Configured filesystem root for scanning |
| **Metadata Enrichment** | Automated matching via IGDB/Steam/GOG providers |
| **Artwork Pipeline** | Cover/banner/logo/screenshot acquisition & management |
| **Collections** | User-curated groupings of archive entries |
| **RBAC** | Role-Based Access Control (Users → Roles → Permissions) |
| **Background Jobs** | Celery tasks for scans, enrichment, artwork (async, tracked) |
| **Audit Logging** | Immutable record of all security-relevant actions |

---

## Graph Statistics

| Category | Count |
|----------|-------|
| **Entities** | 332 |
| **Relationships** | 861 |
| **Total Graph Records** | 1,193 |
| **Domain Files** | 18 |
| **Flow Diagrams** | 6 |
| **Test Coverage Records** | 92 |

### Entity Breakdown

| Entity Type | Count |
|-------------|-------|
| Router | 20 |
| APIRoute | 87 |
| Service | 20 |
| Repository | 16 |
| Model | 18 |
| Schema | 67 |
| Provider | 6 |
| Task | 7 |
| DBTable | 27 |
| DBEnum | 7 |
| Association | 9 |
| TestFile | 20 |
| Domain | 19 |
| Layer | 5 |
| ExternalProvider | 4 |

### Relationship Breakdown

| Relationship Type | Count |
|-------------------|-------|
| EXPOSES | 87 |
| BELONGS_TO | 132 |
| TESTS | 92 |
| CALLS | 84 |
| EXTENDS | 41 |
| ACCESSES | 32 |
| READS | 64 |
| FLOWS_TO | 108 |
| DEPENDS_ON | 34 |
| MAPS_TO | 25 |
| WRITES | 49 |
| ASSOCIATED_THROUGH | 16 |
| DEFINES | 18 |
| MANY_TO_MANY | 17 |
| MANY_TO_ONE | 12 |
| ONE_TO_MANY | 11 |
| USES_PROVIDER | 10 |
| NESTS | 8 |
| CONSUMES | 8 |
| USES_ENUM | 5 |
| DISPATCHES | 5 |
| PROVIDES | 3 |

---

## Getting Started

### For New Sessions

1. **Read `_state.md`** — Understand current phase and completed work
2. **Review `_schema.md`** — Learn entity/relationship types
3. **Check `_decisions.md`** — Understand architectural commitments
4. **Browse `domains/`** — Read domain overviews for the area you're working on
5. **Browse `flows/`** — Read end-to-end flow diagrams

### For Querying Existing Graph

```bash
# List all entity types
jq -r '.type' graph/entities/*.jsonl | sort -u

# Find entities by type
grep '"type":"Service"' graph/entities/backend_services.jsonl

# Find relationships
grep '"type":"DEPENDS_ON"' graph/relationships/*.jsonl

# Count entities per file
for f in graph/entities/*.jsonl; do echo "$(wc -l < $f) $f"; done | sort -rn

# Find all FLOWS_TO chains (cross-layer tracing)
grep '"type":"FLOWS_TO"' graph/relationships/backend_cross_layer.jsonl

# Find test coverage for a service
grep 'TESTS.*MetadataService' graph/relationships/backend_test_coverage.jsonl
```

---

## Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Update `_state.md` after each session | Every session | Active analyst |
| Re-extract changed files | On significant code changes | Active analyst |
| Validate graph consistency | After each phase | Active analyst |
| Archive old graph versions | Quarterly | Maintainer |

---

## Related Documentation

| Document | Location |
|----------|----------|
| Architecture Overview | `docs/architecture/Architecture-Overview.md` |
| Backend Architecture | `docs/architecture/Backend-Architecture.md` |
| Data Model (ERD) | `docs/architecture/Data-Model.md` |
| Processing Pipeline | `docs/architecture/Processing-Pipeline.md` |
| API Reference | `docs/api/API-Guide.md` |
| Deployment Guide | `docs/deployment/Deployment.md` |

---

## Version Information

- **Graph Schema Version**: 1.0 (defined in `_schema.md`)
- **Repository Commit**: Run `git rev-parse HEAD` in repo root
- **Last Updated**: 2026-09-07 (Graph repair & validation complete)
- **Total Graph Records**: 1,193 (332 entities + 861 relationships)

---

> **Remember**: This knowledge graph is a *derived artifact*. Always verify against source code. The graph enables fast navigation; the source code is the ground truth.