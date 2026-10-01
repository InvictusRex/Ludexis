# Knowledge Graph Decision Log

Decisions about how the Ludexis knowledge graph is modeled, stored, and maintained.
Each entry: **Decision**, **Context**, **Alternatives**, **Consequences**, **Status**.
Statuses: `Accepted`, `Superseded by ADR-NNN`, `Proposed`.

---

## ADR-001: Fixed Graph Schema

**Decision**: All graph data conforms to the entity and relationship types defined in `_schema.md`. A type not listed there is invalid.

**Context**: The graph serves several query patterns (impact analysis, data-flow tracing, test coverage, frontend-to-backend mapping). Consistency across extraction passes requires one contract.

**Alternatives**: Ad-hoc types that evolve during extraction (rejected: drift, which is what happened in v1); generic code-index formats such as LSIF (rejected: no notion of domains, layers, jobs, providers).

**Consequences**: Schema changes must update `_schema.md`, the data, and `queries/validate.py` together.

**Status**: Accepted

---

## ADR-002: Entity ID Format

**Decision**: Deterministic, human-readable IDs with a type prefix. The canonical prefixes are listed in `_schema.md`. Examples: `service:app.services.metadata.MetadataService`, `api:GET:/archive-entries/{archive_entry_id}`, `table:archive_entries`, `page:/archive/[id]`, `apifn:lib/api/archives.archiveApi.getById`.

**Context**: IDs must be stable across extractions, mergeable, and readable. Because they are deterministic, independent extraction passes (backend, frontend) can reference each other's IDs without coordination.

**Alternatives**: UUIDs (rejected: opaque, not deterministic); content hashes (rejected: change on every edit); integers (rejected: not mergeable).

**Consequences**: Renaming a file, class, or route changes its ID; that is intentional and caught by the validator. The v1 documentation described `class:` and `route:GET /api/...` prefixes that were never used in the data; v2 documents what is actually stored.

**Status**: Accepted (revised 2026-09-12)

---

## ADR-003: Provenance on Every Record

**Decision**: Entities carry `source_file`, `source_line_start`, `source_line_end`, `discovered_at`, `last_verified_at`, `commit_hash`. Relationships carry `source_file`, `source_line`, `confidence`, `inferred`.

**Context**: The graph is a derived artifact. Every claim must be checkable by opening the source at a given line.

**Alternatives**: Provenance only on entities (rejected: edges need verification too); no provenance (rejected).

**Consequences**: Extraction is AST/parse based so line numbers are exact. `commit_hash` lets the validator warn when code has moved on since the last verification.

**Status**: Accepted

---

## ADR-004: Layer and Domain Classification

**Decision**: Every code entity has exactly one `BELONGS_TO layer:*` edge and exactly one `BELONGS_TO domain:*` edge. Layers cover both stacks (`api`, `service`, `repository`, `model`, `schema`, `task`, `provider`, `core`, `database`, `frontend-page`, `frontend-component`, `frontend-hook`, `frontend-context`, `frontend-api`, `frontend-lib`, `frontend-type`). Domains are the 19 listed in `_schema.md`, each with a file under `domains/`.

**Context**: Queries need both views: "everything in the metadata domain" (feature work) and "everything in the service layer" (architectural work). Domain membership is how a developer finds all files for a feature across backend and frontend.

**Alternatives**: Single hierarchy (rejected: layer and domain are orthogonal); infer domain from file path (rejected: e.g. `JobHistory` lives in models but belongs to `job`).

**Consequences**: Ambiguous cases are decided once and recorded here:
- `JobHistory`, `JobHistoryRepository`, `JobService`, `JobMonitorService` belong to `job`; scanner-backed job tasks (`verify_integrity_task`, `detect_duplicates_task`) belong to `scan` with the other `scan_tasks`.
- `AuditLog`, `AuditLogRepository`, `AuditService`, `AuditLogService` belong to `audit`.
- API routes take the domain of their router (`health` and `main.py` routes belong to `core`, except `/media` which belongs to `storage`).
- UI primitives (`components/ui/*`) and generic libraries belong to `core`.

**Status**: Accepted (revised 2026-09-12)

---

## ADR-005: Directed Relationships

**Decision**: All relationships are directed, source to target, with the semantics listed in `_schema.md` (for example `CALLS`: route handler uses service; `CALLS_ENDPOINT`: frontend API function hits backend route; `TESTS`: test file covers target).

**Context**: Traversal must be unambiguous: `trace` follows edges forward, `impact` follows them in reverse.

**Alternatives**: Undirected edges (rejected: loses meaning).

**Consequences**: ORM relationships are stored once per declaring model (`MANY_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_MANY`).

**Status**: Accepted

---

## ADR-006: JSON Lines Storage, Split by Area

**Decision**: Store the graph as JSONL, one record per line, split into files by stack and area (`backend_*.jsonl`, `frontend_*.jsonl`) under `graph/entities/` and `graph/relationships/`. Lines are sorted for stable diffs. There is no combined `entities.jsonl`; the split files are the index.

**Context**: One file would be too large to read in one pass. Split files let a reader load only the area it needs (for example only `frontend_api.jsonl` when changing an API client).

**Alternatives**: SQLite (rejected: binary, not diffable); a graph database (rejected: external service); a single JSON file (rejected: too large).

**Consequences**: Cross-file references are resolved by `queries/kg.py` and checked by `queries/validate.py`.

**Status**: Accepted (revised 2026-09-12: v1 promised per-type index files that never existed)

---

## ADR-007: Extraction Order

**Decision**: Extract in dependency order: backend structure, database, API surface, frontend, then cross-cutting edges. Backend and frontend passes can run in parallel because IDs are deterministic (ADR-002).

**Context**: Later passes reference IDs from earlier ones.

**Alternatives**: Single-pass extraction of everything (rejected: hard to validate).

**Consequences**: Each pass validates its own files; `validate.py` checks the whole graph at the end.

**Status**: Accepted

---

## ADR-008: Next.js-Aligned Frontend Entities

**Decision**: Model the frontend as `Page`, `Layout`, `Component`, `Hook`, `Context`, `ApiModule`, `ApiFunction`, `LibUtil`, `TypeModule`, `Type`, and frontend `TestFile`, rather than generic classes and functions.

**Context**: App Router conventions (route folders, client components, provider contexts) and the `lib/api` client layer carry the meaning developers need: which page shows what, and which backend route it hits.

**Alternatives**: Reuse backend types (rejected: loses route and client-call semantics); model every JSX element (rejected: too granular).

**Consequences**: `ApiFunction` is the bridge between stacks: `Page/Component -CALLS_API-> ApiFunction -CALLS_ENDPOINT-> APIRoute -CALLS-> Service`. `Type -MIRRORS-> Schema` records where frontend types track backend schemas, including field mismatches.

**Status**: Accepted (implemented 2026-09-12)

---

## ADR-009: Celery Tasks as Entities

**Decision**: Model Celery tasks as `Task` entities with `DISPATCHES` (Service to Task) and `CONSUMES` (Task to Service/Repository) edges. Beat schedules are stored as task properties.

**Context**: Scans, metadata refresh, and artwork validation all run in the background.

**Alternatives**: A separate `BackgroundJob` entity per job type (dropped: `JobType` is already a `DBEnum`, and tasks carry the job semantics).

**Consequences**: `CONSUMES` edges must reflect what the task body actually instantiates (v1 had four incorrect edges to `JobService`; the tasks use `JobHistoryRepository` directly).

**Status**: Accepted (revised 2026-09-12)

---

## ADR-010: External Providers as Distinct Entities

**Decision**: External services (IGDB, Steam, GOG) are `ExternalProvider` entities. Provider classes are `Provider` entities linked with `PROVIDES`; services link to providers with `USES_PROVIDER` or `DEPENDS_ON`.

**Context**: Enables "which features depend on IGDB?".

**Alternatives**: Treat provider classes as services (rejected: loses the external boundary).

**Consequences**: The GOG and manual providers are stubs; this is recorded in their properties.

**Status**: Accepted

---

## ADR-011: Soft Delete Awareness

**Decision**: `Model` entities carry `is_soft_delete: true` when the model has a `deleted_at` column (currently `ArchiveEntry`, `Collection`, `Library`, `User`).

**Context**: Deletes on these tables are updates, which matters for data-flow analysis.

**Alternatives**: Ignore soft delete (rejected: misrepresents the data lifecycle).

**Consequences**: Repositories expose `*_active` query methods for these models.

**Status**: Accepted

---

## ADR-012: Test Granularity at File Level

**Decision**: Tests are modeled as `TestFile` entities with `test_count`, and `TESTS` edges go from the test file to the code it exercises. Individual test cases are not modeled.

**Context**: The question developers ask is "which test files do I run or update when I change X?". File level answers it; per-case entities would double the graph for little gain.

**Alternatives**: Per-case `TestSuite`/`TestCase` entities (dropped: high churn, low value).

**Consequences**: The validator checks `test_count` against the source.

**Status**: Accepted (revised 2026-09-12; supersedes the v1 per-case plan, which was never implemented)

---

## ADR-013: Configuration Captured on Module Entities

**Decision**: Configuration is not a separate entity type. The `module:app.core.config` entity lists the `Settings` fields in `settings_fields`. Environment and Compose files are documented in `docs/deployment/Deployment.md`.

**Context**: Per-field `Config` entities with `READS` edges from every `settings.X` access would be high-volume and churn-prone.

**Alternatives**: Full config entity graph (deferred until a concrete need appears).

**Consequences**: "Who reads setting X" is answered with grep, not the graph.

**Status**: Accepted (2026-09-12)

---

## ADR-014: Migrations in the Graph

**Decision**: Alembic revisions are `Migration` entities with `CREATES` edges to the tables they create.

**Context**: The schema currently has one baseline revision (`ecabaf1d5dab`); later revisions should be added as they appear.

**Alternatives**: Current schema only (rejected: no history).

**Consequences**: Adding a migration requires adding a `Migration` entity; the validator reports revisions missing from the graph.

**Status**: Accepted (implemented 2026-09-12)

---

## ADR-015: Incremental Updates Gated by the Validator

**Decision**: The graph is updated incrementally: re-extract the files that changed, patch records by ID, and set `last_verified_at` and `commit_hash`. `queries/validate.py` must pass before a change to the graph is committed.

**Context**: Full re-extraction is expensive. Without a mechanical check, v1 drifted (wrong counts, made-up method names in flow docs).

**Alternatives**: Full re-extraction every time (rejected: slow); trust manual review (rejected: failed in v1).

**Consequences**: Deleted code means deleted records; there is no soft delete inside the graph. The validator warns when the newest commit touching `backend/` or `frontend/` differs from the recorded `commit_hash`.

**Status**: Accepted (2026-09-12)

---

## ADR-016: Query Interface as CLI Scripts

**Decision**: Queries are standard-library Python scripts in `queries/`: `validate.py` (consistency check against code) and `kg.py` (`find`, `show`, `files`, `trace`, `impact`).

**Context**: Readers are developers and tools working from a shell. Scripts are portable and version-controlled.

**Alternatives**: GraphQL API or graph database (rejected: needs a running service).

**Consequences**: No third-party dependencies, so the scripts run anywhere Python 3.12+ runs.

**Status**: Accepted (implemented 2026-09-12)

---

## ADR-017: No Source Code Modification

**Decision**: Building or updating the graph never modifies application code. All outputs live in `docs/knowledge/`.

**Context**: The graph documents the code; it must not change it.

**Alternatives**: Annotating source with graph IDs (rejected: noise, merge conflicts).

**Consequences**: Integration bugs found during extraction (for example frontend calls to non-existent routes) are reported in `_state.md`, not fixed as part of graph work.

**Status**: Accepted

---

## ADR-018: Association Tables Are DBTables

**Decision**: The nine association tables are `DBTable` entities with `is_association: true`. The v1 `AssociationTable` type and `assoc:` prefix are removed.

**Context**: v1 stored every association table twice (for example `table:user_roles` and an `assoc:` duplicate of it), and four of the `table:` copies had no edges.

**Alternatives**: Keep a separate type (rejected: duplication).

**Consequences**: Models link to them with `ASSOCIATED_THROUGH`.

**Status**: Accepted (2026-09-12)

---

## ADR-019: Plain ASCII Punctuation

**Decision**: Files under `docs/knowledge/` use plain ASCII punctuation; em and en dashes are not used.

**Context**: v1 domain records contained mojibake (a UTF-8 em dash decoded as cp1252). Avoiding the character removes the failure mode.

**Alternatives**: Keep Unicode punctuation and enforce encoding (rejected: the same tools that broke it would break it again).

**Consequences**: `validate.py` reports any em dash, en dash, or mojibake as an error.

**Status**: Accepted (2026-09-12)

---

## Decision Index

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Fixed Graph Schema | Accepted |
| ADR-002 | Entity ID Format | Accepted (revised) |
| ADR-003 | Provenance on Every Record | Accepted |
| ADR-004 | Layer and Domain Classification | Accepted (revised) |
| ADR-005 | Directed Relationships | Accepted |
| ADR-006 | JSON Lines Storage, Split by Area | Accepted (revised) |
| ADR-007 | Extraction Order | Accepted |
| ADR-008 | Next.js-Aligned Frontend Entities | Accepted |
| ADR-009 | Celery Tasks as Entities | Accepted (revised) |
| ADR-010 | External Providers as Distinct Entities | Accepted |
| ADR-011 | Soft Delete Awareness | Accepted |
| ADR-012 | Test Granularity at File Level | Accepted (revised) |
| ADR-013 | Configuration Captured on Module Entities | Accepted |
| ADR-014 | Migrations in the Graph | Accepted |
| ADR-015 | Incremental Updates Gated by the Validator | Accepted |
| ADR-016 | Query Interface as CLI Scripts | Accepted |
| ADR-017 | No Source Code Modification | Accepted |
| ADR-018 | Association Tables Are DBTables | Accepted |
| ADR-019 | Plain ASCII Punctuation | Accepted |

---

## How to Add a Decision

1. Add an ADR with the next number and fill every section.
2. Add it to the Decision Index.
3. If it changes types or IDs, update `_schema.md` and `queries/validate.py` in the same change.
