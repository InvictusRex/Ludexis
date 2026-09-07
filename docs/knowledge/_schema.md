# Knowledge Graph Schema

## Overview

This document defines the canonical schema for the Ludexis knowledge graph. The graph represents the codebase as a network of entities and relationships, enabling efficient navigation and analysis across sessions.

Every entity has a **stable identifier** (UUID or deterministic path-based ID) and **source/provenance** information (file path, line numbers, commit hash).

---

## Entity Types

### Structural Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `Directory` | `dir:<relative_path>` | File system directory |
| `File` | `file:<relative_path>` | Source file |
| `Module` | `module:<python_module_path>` | Python module (e.g., `app.api.archive_entries`) |
| `Package` | `pkg:<python_package_path>` | Python package directory |

### Backend Code Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `Class` | `class:<module_path>.<ClassName>` | Python class |
| `Function` | `func:<module_path>.<function_name>` | Module-level function |
| `Method` | `method:<module_path>.<ClassName>.<method_name>` | Instance/class method |
| `Property` | `prop:<module_path>.<ClassName>.<property_name>` | Class property |
| `Constant` | `const:<module_path>.<CONSTANT_NAME>` | Module-level constant |
| `Enum` | `enum:<module_path>.<EnumName>` | Python Enum |

### Backend Architecture Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `APIRoute` | `route:<HTTP_METHOD> <path>` | FastAPI endpoint |
| `Router` | `router:<module_path>` | FastAPI APIRouter instance |
| `Service` | `service:<module_path>.<ClassName>` | Business logic class in `app/services/` |
| `Repository` | `repo:<module_path>.<ClassName>` | Data access class in `app/repositories/` |
| `Model` | `model:<module_path>.<ClassName>` | SQLAlchemy ORM model in `app/models/` |
| `Schema` | `schema:<module_path>.<ClassName>` | Pydantic schema in `app/schemas/` |
| `Task` | `task:<module_path>.<function_name>` | Celery task in `app/tasks/` |
| `Provider` | `provider:<module_path>.<ClassName>` | External integration in `app/providers/` |
| `Dependency` | `dep:<module_path>.<function_name>` | FastAPI dependency in `app/core/dependencies.py` |

### Database Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `DBTable` | `table:<table_name>` | PostgreSQL table |
| `DBColumn` | `col:<table_name>.<column_name>` | Table column |
| `DBIndex` | `idx:<table_name>.<index_name>` | Database index |
| `DBConstraint` | `constraint:<table_name>.<constraint_name>` | FK, UK, CK constraints |
| `DBEnum` | `dbenum:<enum_name>` | PostgreSQL enum type |
| `Migration` | `migration:<revision_id>` | Alembic migration |

### Frontend Code Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `Page` | `page:<route_path>` | Next.js App Router page (e.g., `/library`, `/admin/users`) |
| `Layout` | `layout:<route_path>` | Next.js layout file |
| `Component` | `comp:<relative_path>` | React component in `components/` |
| `Hook` | `hook:<relative_path>` | Custom hook in `hooks/` |
| `Context` | `ctx:<relative_path>` | React Context in `contexts/` |
| `LibUtil` | `lib:<relative_path>` | Utility in `lib/` (api, auth, types, etc.) |
| `Type` | `type:<relative_path>.<TypeName>` | TypeScript type/interface |

### Testing Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `TestFile` | `test:<relative_path>` | Test file |
| `TestSuite` | `suite:<test_file>::<describe_block>` | Test suite/group |
| `TestCase` | `case:<test_file>::<test_name>` | Individual test |

### Domain/Architectural Entities

| Type | ID Format | Description |
|------|-----------|-------------|
| `Domain` | `domain:<name>` | Business domain (e.g., `archive`, `metadata`, `auth`, `rbac`) |
| `Layer` | `layer:<name>` | Architectural layer (`api`, `service`, `repository`, `model`, `schema`, `task`, `provider`) |
| `ExternalProvider` | `extprov:<name>` | External service (IGDB, Steam, GOG, etc.) |
| `BackgroundJob` | `job:<task_name>` | Celery background job type |

---

## Relationship Types

| Relationship | Source → Target | Description |
|--------------|-----------------|-------------|
| `CONTAINS` | Directory → File/Directory | File system containment |
| `DEFINES` | File/Module → Class/Function/Constant | Definition location |
| `IMPORTS` | Module/File → Module/File | Import dependency |
| `CALLS` | Function/Method → Function/Method | Direct function call |
| `USES` | Function/Method → Class/Service/Repository | Uses as dependency |
| `EXTENDS` | Class → Class | Inheritance |
| `IMPLEMENTS` | Class → Interface/Protocol | Interface implementation |
| `DEPENDS_ON` | Service → Repository/Service/Provider | Architectural dependency |
| `EXPOSES` | Router → APIRoute | Router registers endpoint |
| `ACCESSES` | Service/Repository → DBTable | Database access |
| `READS` | Service/Repository → DBTable | Read operation |
| `WRITES` | Service/Repository → DBTable | Write operation |
| `DISPATCHES` | Service/APIRoute → Task/Job | Enqueues background job |
| `CONSUMES` | Task/Job → Service/Repository | Background job consumes service |
| `RENDERS` | Page/Component → Component | React rendering |
| `TESTS` | TestCase → Function/Method/Class/Component | Test coverage |
| `BELONGS_TO` | Entity → Domain | Domain membership |
| `BELONGS_TO` | Entity → Layer | Layer membership |
| `IMPLEMENTS_DOMAIN` | Service/Repository → Domain | Implements domain logic |
| `FLOWS_TO` | Entity → Entity | Data/control flow |
| `HAS_RELATIONSHIP` | DBTable → DBTable | Foreign key relationship |
| `PROVIDES` | Provider → ExternalProvider | Implements external integration |
| `USES_PROVIDER` | Service/Task → Provider | Uses external provider |

---

## Entity Properties

### Common Properties (all entities)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Stable unique identifier |
| `type` | string | Yes | Entity type from above |
| `name` | string | Yes | Human-readable name |
| `source_file` | string | Yes | Relative path to source file |
| `source_line_start` | integer | Yes | Starting line number |
| `source_line_end` | integer | No | Ending line number |
| `discovered_at` | ISO8601 | Yes | When this entity was added to graph |
| `last_verified_at` | ISO8601 | No | Last confirmed to exist |
| `commit_hash` | string | No | Git commit when discovered |

### Type-Specific Properties

#### Class
```json
{
  "is_abstract": boolean,
  "base_classes": ["class_id"],
  "decorators": ["decorator_name"],
  "docstring": "string"
}
```

#### Function/Method
```json
{
  "is_async": boolean,
  "is_generator": boolean,
  "parameters": [{"name": "str", "type": "str", "default": "any"}],
  "return_type": "str",
  "decorators": ["decorator_name"],
  "docstring": "string",
  "complexity": integer
}
```

#### APIRoute
```json
{
  "method": "GET|POST|PUT|DELETE|PATCH",
  "path": "/api/...",
  "summary": "string",
  "tags": ["tag"],
  "requires_auth": boolean,
  "required_permissions": ["perm"],
  "response_model": "schema_id",
  "status_codes": [200, 404, ...]
}
```

#### Model
```json
{
  "table_name": "string",
  "columns": ["col_id"],
  "relationships": ["rel_id"],
  "indexes": ["idx_id"],
  "is_soft_delete": boolean
}
```

#### Service
```json
{
  "public_methods": ["method_id"],
  "depends_on": ["service_id", "repo_id", "provider_id"],
  "dispatches_jobs": ["job_id"]
}
```

#### Component
```json
{
  "is_client_component": boolean,
  "props_interface": "type_id",
  "hooks_used": ["hook_id"],
  "contexts_used": ["ctx_id"]
}
```

#### Page
```json
{
  "route": "/path",
  "layout": "layout_id",
  "components": ["comp_id"],
  "data_fetching": "server|client|static",
  "auth_required": boolean
}
```

#### DBTable
```json
{
  "schema": "public",
  "columns": ["col_id"],
  "primary_key": ["col_id"],
  "foreign_keys": [{"column": "col_id", "references": "table.column"}],
  "indexes": ["idx_id"],
  "row_estimate": integer
}
```

---

## Relationship Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `source_id` | string | Yes | Source entity ID |
| `target_id` | string | Yes | Target entity ID |
| `type` | string | Yes | Relationship type from above |
| `confidence` | float | No | 0.0-1.0 confidence score |
| `source_file` | string | Yes | File where relationship is evident |
| `source_line` | integer | No | Line number |
| `inferred` | boolean | No | Whether inferred vs explicit |

---

## Graph Storage Format

### JSON Lines (`.jsonl`)

Each line is a complete entity or relationship object.

**Entity line:**
```json
{"id": "class:app.services.metadata.MetadataService", "type": "Service", "name": "MetadataService", "source_file": "backend/app/services/metadata.py", "source_line_start": 1, "source_line_end": 450, "discovered_at": "2026-09-07T...", "properties": {"public_methods": [...], "depends_on": [...]}}
```

**Relationship line:**
```json
{"source_id": "service:app.services.metadata.MetadataService", "target_id": "provider:app.providers.igdb.IGDBProvider", "type": "USES_PROVIDER", "source_file": "backend/app/services/metadata.py", "source_line": 42, "confidence": 0.95}
```

### Index Files

- `entities.jsonl` - All entities
- `relationships.jsonl` - All relationships
- `entities_by_type/<type>.jsonl` - Per-type indexes
- `entities_by_file/<file_path>.jsonl` - Per-file indexes

---

## Provenance Tracking

Every entity and relationship must track:
1. **Source file** - Where in the codebase this was discovered
2. **Line range** - Exact location
3. **Discovery method** - `ast_parse`, `regex`, `manual`, `import_analysis`
4. **Confidence** - For inferred relationships
5. **Git commit** - For historical tracking

---

## Query Patterns

The schema supports these key queries:

1. **Find all services in a domain** → Filter `Service` by `BELONGS_TO domain:metadata`
2. **Find API routes for a feature** → Filter `APIRoute` by path prefix
3. **Trace data flow** → Follow `READS`/`WRITES`/`FLOWS_TO` from APIRoute → Service → Repository → DBTable
4. **Find test coverage** → `TESTS` relationships from TestCase
5. **Impact analysis** → Reverse `DEPENDS_ON`/`USES` from changed entity
6. **Database schema** → `DBTable` with `HAS_RELATIONSHIP` edges
7. **Frontend page composition** → `RENDERS` from Page → Component tree