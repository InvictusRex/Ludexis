# Architectural Decisions Log

This document records significant architectural decisions made during the analysis and knowledge graph construction for Ludexis. Each entry follows the format: **Decision**, **Context**, **Alternatives Considered**, **Consequences**, **Status**.

---

## ADR-001: Knowledge Graph Schema Design

**Decision**: Define a comprehensive entity/relationship schema (`_schema.md`) covering files, code constructs, architecture layers, database, frontend, tests, and domains before extraction begins.

**Context**: The knowledge graph must serve multiple query patterns (impact analysis, data flow tracing, test coverage, API mapping, database schema). A fixed schema ensures consistency across extraction phases.

**Alternatives Considered**:
- Ad-hoc schema evolving during extraction → Rejected: leads to inconsistency, requires re-extraction
- Minimal schema (only files/classes/functions) → Rejected: insufficient for architectural queries
- Use existing schema (e.g., CodeQL, LSIF) → Rejected: not tailored to Ludexis-specific concepts (domains, layers, background jobs, providers)

**Consequences**:
- Upfront schema design effort
- All extractors must conform to schema
- Schema changes require migration of existing graph data

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-002: Entity ID Format

**Decision**: Use deterministic, human-readable IDs with type prefixes:
- `module:app.services.metadata`
- `class:app.services.metadata.MetadataService`
- `route:GET /api/archive-entries`
- `table:archive_entries`
- `page:/library`

**Context**: IDs must be stable across extractions, sortable, and debuggable. UUIDs are opaque; path-based IDs are transparent.

**Alternatives Considered**:
- UUIDv4 → Rejected: not deterministic, not human-readable
- Hash of content → Rejected: changes on any modification, breaks stability
- Simple incrementing integers → Rejected: not mergeable across parallel extractions

**Consequences**:
- IDs encode type and location
- Renaming a file/module changes IDs (intentional — reflects actual change)
- Cross-references use same ID format

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-003: Provenance Tracking on Every Entity/Relationship

**Decision**: Every entity and relationship must include `source_file`, `source_line_start`, `source_line_end` (entities) or `source_line` (relationships), plus `discovered_at` and `commit_hash`.

**Context**: The graph is a derived artifact. Users must be able to verify any claim by navigating to source code. Git commit enables historical tracking.

**Alternatives Considered**:
- Provenance only on entities → Rejected: relationships need verification too
- Provenance in separate index → Rejected: adds join complexity, risks separation
- No provenance → Rejected: defeats purpose of verifiable knowledge base

**Consequences**:
- Larger graph storage
- Extraction tools must capture line numbers (AST-based parsing preferred)
- Enables "go to definition" from graph queries

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-004: Layer-Based Domain Classification

**Decision**: Classify every backend entity into both an **architectural layer** (`api`, `service`, `repository`, `model`, `schema`, `task`, `provider`) and a **business domain** (`archive`, `metadata`, `auth`, `rbac`, `artwork`, `scan`, `collection`, `library`, `search`, `job`, `audit`, `user`).

**Context**: Queries need both perspectives: "all services in metadata domain" and "all entities in service layer".

**Alternatives Considered**:
- Single classification hierarchy → Rejected: layer and domain are orthogonal concerns
- Tags instead of structured classification → Rejected: less queryable, no validation
- Infer domain from file path → Rejected: `app/services/metadata.py` is clear, but `app/services/scanner.py` spans `scan` + `archive` domains

**Consequences**:
- Each entity has `BELONGS_TO layer:x` and `BELONGS_TO domain:y` relationships
- Extractors must assign both (may require manual review for ambiguous cases)
- Enables powerful cross-dimensional queries

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-005: Relationship Directionality Semantics

**Decision**: Relationships are directed with specific semantics:
- `DEPENDS_ON`: A requires B to function (A → B)
- `USES`: A uses B as a tool/dependency (A → B)
- `CALLS`: A directly invokes B (A → B)
- `READS`/`WRITES`: Service/Repository → DBTable (direction = data flow)
- `DISPATCHES`: API/Service → Task (enqueues)
- `CONSUMES`: Task → Service/Repository (executes)
- `EXPOSES`: Router → Route (router registers)
- `RENDERS`: Page/Component → Component (parent renders child)
- `TESTS`: TestCase → Target (test covers)

**Context**: Direction must be unambiguous for graph traversal algorithms (impact analysis = reverse DEPENDS_ON; data flow = forward READS/WRITES).

**Alternatives Considered**:
- Undirected relationships with type → Rejected: loses semantic direction
- Bidirectional for all → Rejected: adds noise, complicates traversal

**Consequences**:
- Extractors must determine direction correctly
- Some relationships are inherently bidirectional (e.g., `HAS_RELATIONSHIP` between tables) — model as two directed edges or single undirected with symmetric semantics

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-006: Graph Storage as JSON Lines

**Decision**: Store graph as `.jsonl` files (one entity/relationship per line) with per-type and per-file indexes.

**Context**: JSONL is streaming-friendly, line-oriented, easily processed by standard tools (jq, awk, Python), and append-only for incremental updates.

**Alternatives Considered**:
- SQLite → Rejected: requires schema migrations, less portable
- Neo4j/Cypher → Rejected: external dependency, overkill for static analysis artifact
- Single large JSON → Rejected: memory issues, not streaming-friendly
- Protocol Buffers → Rejected: requires schema compilation, less human-readable

**Consequences**:
- Simple tooling for queries (grep, jq, Python scripts)
- Index files enable fast filtering by type/file
- No graph database features (traversal, path finding) — must implement in query scripts

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-007: Extraction Phases Aligned to Architecture Layers

**Decision**: Structure extraction phases to match backend architectural layers (Phase 2: Services/Repositories/Models → Phase 3: Database → Phase 4: API → Phase 5: Frontend → Phase 6: Cross-cutting).

**Context**: The layered architecture has clear dependencies (API → Services → Repositories → Models). Extracting in dependency order ensures referenced entities exist when needed.

**Alternatives Considered**:
- Extract by file system walk → Rejected: creates forward references, requires multi-pass resolution
- Extract by feature/domain → Rejected: crosses layers, duplicates effort
- Single-pass extraction of everything → Rejected: too large, error-prone, hard to validate incrementally

**Consequences**:
- Phase 2 produces entities that Phase 4 references
- Validation at phase boundaries catches missing entities early
- Frontend extraction (Phase 5) independent until cross-cutting (Phase 6)

**Status**: ✅ Accepted — Defined in `_state.md`

---

## ADR-008: Frontend Entity Types Aligned to Next.js App Router

**Decision**: Model frontend entities as `Page`, `Layout`, `Component`, `Hook`, `Context`, `LibUtil`, `Type` rather than generic `Function`/`Class`.

**Context**: Next.js App Router has distinct conventions (pages, layouts, server/client components) that map poorly to backend code entities.

**Alternatives Considered**:
- Reuse backend types (`Class`, `Function`) → Rejected: loses framework semantics (e.g., `Page` has route, `Component` has props interface)
- Model every React element → Rejected: too granular, volatile

**Consequences**:
- Frontend extraction needs Next.js-aware parsing (file conventions, `use client` directive)
- `Page` entities link to `route` property for URL mapping
- `Component` entities track `is_client_component` for hydration analysis

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-009: Background Job as First-Class Graph Entity

**Decision**: Model Celery tasks as `Task` entities and job types as `BackgroundJob` entities, with `DISPATCHES` (API/Service → Task) and `CONSUMES` (Task → Service/Repository) relationships.

**Context**: Background processing is central to Ludexis (scans, metadata, artwork). Understanding async flows requires explicit job entities.

**Alternatives Considered**:
- Model only as `CALLS` to `celery_app.send_task` → Rejected: loses task signature, retry policy, queue info
- Ignore background jobs → Rejected: misses critical async architecture

**Consequences**:
- Task extraction parses `@celery_app.task` decorators
- `DISPATCHES` links show where async work originates
- `CONSUMES` links show what tasks actually execute

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-010: External Providers as Distinct Entities

**Decision**: Model external integrations (IGDB, Steam, GOG) as `ExternalProvider` entities, with provider implementations as `Provider` entities linked via `PROVIDES`/`USES_PROVIDER`.

**Context**: Provider abstraction is a key architectural pattern. The graph should show which services use which external systems.

**Alternatives Considered**:
- Treat provider classes as regular `Service` → Rejected: loses "external" distinction, can't query "all external dependencies"
- Inline provider calls as `CALLS` to HTTP client → Rejected: too low-level, misses provider abstraction

**Consequences**:
- `Provider` entities belong to `layer:provider` and `domain:metadata`
- `ExternalProvider` entities are singleton references (IGDB, Steam, GOG)
- Enables query: "Which domains depend on IGDB?"

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-011: Soft Delete Awareness in Graph

**Decision**: Mark entities with soft-delete capability (`deleted_at` column) via property `is_soft_delete: true` on `Model` entities.

**Context**: Many Ludexis models use soft delete. This affects data flow analysis (DELETE → UPDATE).

**Alternatives Considered**:
- Ignore soft delete → Rejected: misrepresents data lifecycle
- Model as separate `DELETE` operation → Rejected: not a hard delete

**Consequences**:
- `WRITES` relationship to soft-delete tables may be UPDATE not DELETE
- Query tools can filter soft-delete tables for audit scenarios

**Status**: ✅ Accepted — Defined in `_schema.md` (Model properties)

---

## ADR-012: Test Entity Granularity

**Decision**: Model tests at `TestFile` → `TestSuite` → `TestCase` hierarchy, with `TESTS` relationships from `TestCase` to target code entities.

**Context**: Need to answer "what tests cover this service?" and "what is untested?"

**Alternatives Considered**:
- Only `TestFile` level → Rejected: too coarse for coverage analysis
- Only `TestCase` level → Rejected: loses organization, hard to navigate

**Consequences**:
- Requires parsing test framework structures (pytest `class TestX`, `def test_y`; Vitest `describe`/`it`)
- `TESTS` relationships may be inferred (naming convention) or explicit (imports)

**Status**: ✅ Accepted — Defined in `_schema.md`

---

## ADR-013: Configuration as Graph Entities

**Decision**: Model configuration (Pydantic Settings, environment variables, Docker Compose services) as `Config` entities with `READS` relationships from code that accesses them.

**Context**: Configuration drives behavior (DB URLs, API keys, feature flags). Tracking config access enables "what breaks if this env var changes?"

**Alternatives Considered**:
- Ignore config → Rejected: misses critical deployment/runtime dependencies
- Model only `.env` files → Rejected: misses code that reads config

**Consequences**:
- Extract `app.core.config.Settings` fields as `Config` entities
- Link `READS` from services/functions that access `settings.X`
- Track `.env*` files as `File` entities with `CONTAINS` config

**Status**: 🟡 Proposed — Add to Phase 2/6 extraction

---

## ADR-014: Migration History in Graph

**Decision**: Include Alembic migrations as `Migration` entities with `DEFINES`/`MODIFIES` relationships to `DBTable`/`DBColumn`.

**Context**: Single baseline migration exists now, but future migrations should be tracked for schema evolution queries.

**Alternatives Considered**:
- Only current schema → Rejected: loses history, can't answer "when was this column added?"
- External tool (e.g., alembic history) → Rejected: not integrated with graph

**Consequences**:
- Parse `alembic/versions/*.py` for `upgrade()`/`downgrade()` operations
- Link migration → tables/columns created/modified/dropped
- Enables temporal queries on schema

**Status**: 🟡 Proposed — Add to Phase 3 extraction

---

## ADR-015: Incremental Graph Updates

**Decision**: Design extraction to support incremental updates — new/changed files re-extracted, graph patched via ID matching.

**Context**: Knowledge graph must stay current as codebase evolves. Full re-extraction is wasteful.

**Alternatives Considered**:
- Full re-extraction on every update → Rejected: slow, loses historical provenance
- Git diff-based patching → Rejected: complex, error-prone for semantic changes

**Consequences**:
- Stable IDs (ADR-002) enable merge-by-ID
- `last_verified_at` timestamp tracks freshness
- Extraction tools must support "update mode" (scan changed files only)
- Deleted entities marked with `deleted_at` in graph (soft delete in graph)

**Status**: 🟡 Proposed — Implement in Phase 7 tooling

---

## ADR-016: Query Interface as CLI Scripts

**Decision**: Provide graph queries as standalone Python/CLI scripts in `docs/knowledge/queries/` rather than a graph database or API.

**Context**: Primary consumers are developers and AI agents in CLI context. Scripts are portable, version-controlled, composable.

**Alternatives Considered**:
- GraphQL API → Rejected: requires running service
- Neo4j + Cypher → Rejected: external dependency
- VS Code extension → Rejected: editor-specific, not CI-friendly

**Consequences**:
- Scripts use standard library + `json`, `pathlib`
- Common queries: `find_service_deps.py`, `trace_api_to_db.py`, `check_test_coverage.py`, `impact_analysis.py`
- Output as JSON or human-readable tables

**Status**: 🟡 Proposed — Implement in Phase 7

---

## ADR-017: No Source Code Modification

**Decision**: Knowledge graph construction must never modify source code. All outputs go to `docs/knowledge/`.

**Context**: This is an analysis/documentation task. The repository must remain pristine.

**Alternatives Considered**:
- Annotate source with graph IDs → Rejected: pollutes source, merge conflicts
- Generate code from graph → Rejected: opposite direction, not this task

**Consequences**:
- `docs/knowledge/` is the only output directory
- Graph is read-only relative to source
- CI can verify graph freshness without modifying repo

**Status**: ✅ Accepted — Enforced by task instructions

---

## Decision Index

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Knowledge Graph Schema Design | ✅ Accepted |
| ADR-002 | Entity ID Format | ✅ Accepted |
| ADR-003 | Provenance Tracking | ✅ Accepted |
| ADR-004 | Layer + Domain Classification | ✅ Accepted |
| ADR-005 | Relationship Directionality | ✅ Accepted |
| ADR-006 | JSONL Storage Format | ✅ Accepted |
| ADR-007 | Layer-Aligned Extraction Phases | ✅ Accepted |
| ADR-008 | Next.js-Aligned Frontend Entities | ✅ Accepted |
| ADR-009 | Background Jobs as First-Class Entities | ✅ Accepted |
| ADR-010 | External Providers as Distinct Entities | ✅ Accepted |
| ADR-011 | Soft Delete Awareness | ✅ Accepted |
| ADR-012 | Test Entity Granularity | ✅ Accepted |
| ADR-013 | Configuration as Entities | 🟡 Proposed |
| ADR-014 | Migration History in Graph | 🟡 Proposed |
| ADR-015 | Incremental Graph Updates | 🟡 Proposed |
| ADR-016 | CLI Query Scripts | 🟡 Proposed |
| ADR-017 | No Source Code Modification | ✅ Accepted |

---

## How to Add a Decision

1. Create new ADR with next sequential number
2. Fill all sections: Decision, Context, Alternatives, Consequences, Status
3. Add to Decision Index table
4. Reference in `_state.md` TODOs if it affects extraction work