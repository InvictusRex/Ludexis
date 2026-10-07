# Knowledge Graph Schema (v2)

The contract for every record under `graph/`. `queries/validate.py` enforces it.
A type, prefix, or relationship not listed here is invalid (ADR-001).

---

## Storage

- JSON Lines: one record per line, UTF-8, plain ASCII punctuation (ADR-019).
- Entities live in `graph/entities/*.jsonl`, relationships in `graph/relationships/*.jsonl`.
- Files are split by stack and area (`backend_*`, `frontend_*`). Load only what you need.
- Entity lines are sorted by `id`; relationship lines by (`source_id`, `type`, `target_id`).

### Entity record

```json
{"id": "service:app.services.metadata.MetadataService", "type": "Service",
 "name": "MetadataService", "source_file": "backend/app/services/metadata.py",
 "source_line_start": 27, "source_line_end": 469,
 "discovered_at": "2026-09-07T12:00:00Z", "last_verified_at": "2026-09-12T00:00:00Z",
 "commit_hash": "202db85", "properties": {"public_methods": ["..."]}}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Prefix per the tables below |
| `type` | yes | Entity type |
| `name` | yes | Class, function, route handler, file, or route name |
| `source_file` | yes | Repo-relative path |
| `source_line_start` | yes | Definition line |
| `source_line_end` | no | Last line of the definition |
| `discovered_at` | yes | ISO 8601 |
| `last_verified_at` | yes | ISO 8601, last time checked against code |
| `commit_hash` | yes | Short hash of the commit the record was verified at |
| `properties` | no | Type-specific, see below |

### Relationship record

```json
{"source_id": "api:GET:/metadata/search", "target_id": "service:app.services.metadata.MetadataService",
 "type": "CALLS", "source_file": "backend/app/api/metadata.py", "source_line": 11,
 "confidence": 1.0, "inferred": false}
```

`source_id`, `target_id`, `type`, `source_file` are required. `source_line`, `confidence` (0 to 1), `inferred`, and `description` are optional.

---

## Entity Types

### Backend

| Type | ID format | Example | Key properties |
|------|-----------|---------|----------------|
| `Router` | `router:app.api.<module>`, `router:main` | `router:app.api.tags` | `prefix`, `tags` |
| `APIRoute` | `api:<METHOD>:<router path>` | `api:GET:/archive-entries/{archive_entry_id}` | `method`, `path` (without `/api`), `full_path` (real URL), `summary`, `requires_auth`, `required_permissions`, `request_schema`, `response_model`, `status_codes` |
| `Service` | `service:app.services.<module>.<Class>` | `service:app.services.scanner.ScannerService` | `public_methods`, `depends_on`, `dispatches_jobs` |
| `Repository` | `repo:app.repositories.<module>.<Class>` | `repo:app.repositories.tag.TagRepository` | `public_methods` |
| `Model` | `model:app.models.<module>.<Class>` | `model:app.models.library.Library` | `table_name`, `columns`, `is_soft_delete` |
| `Schema` | `schema:app.schemas.<module>.<Class>` | `schema:app.schemas.auth.Token` | `kind`, `fields`, `maps_to_model` |
| `Provider` | `provider:app.providers.<module>.<Class>` | `provider:app.providers.igdb.IGDBProvider` | `is_abstract`, `public_methods` |
| `Task` | `task:app.tasks.<module>.<function>` | `task:app.tasks.scan_tasks.scan_full_task` | `celery_task_name`, retry policy, `is_scheduled`, schedule |
| `Class` | `class:<module>.<Class>` | `class:app.services.scanner.ArchiveScanItem` | helper classes that are not services, repositories, etc. |
| `Module` | `module:<dotted path>` | `module:app.core.auth`, `module:main` | `public_functions`, `public_classes`, `purpose`, `settings_fields` (config only) |
| `Migration` | `migration:<revision>` | `migration:ecabaf1d5dab` | `down_revision`, `tables_created` |
| `DBTable` | `table:<name>` | `table:user_roles` | `columns`, `primary_key`, `foreign_keys`, `indexes`, `is_association` |
| `DBEnum` | `dbenum:<name>` | `dbenum:job_status` | `values`, `python_class` |

### Frontend

Paths in frontend IDs are relative to `frontend/` and have no file extension.

| Type | ID format | Example | Key properties |
|------|-----------|---------|----------------|
| `Page` | `page:<route>` | `page:/archive/[id]` | `route`, `is_client`, `auth_guard`, `api_functions_used`, `components_used` |
| `Layout` | `layout:<route>` | `layout:/` | |
| `Component` | `comp:<path>` | `comp:components/common/archive-entry-card` | `category` (common/layout/ui/root), `is_client`, `exports`, `has_test` |
| `Hook` | `hook:<path>` | `hook:hooks/use-protected-route` | `exports` |
| `Context` | `ctx:<path>` | `ctx:contexts/auth-context` | `exports`, `provides` |
| `ApiModule` | `apimod:<path>` | `apimod:lib/api/archives` | `export_name`, `functions` |
| `ApiFunction` | `apifn:<path>.<object>.<method>` | `apifn:lib/api/archives.archiveApi.getById` | `http_method`, `client_path`, `backend_route`, `return_type` |
| `LibUtil` | `lib:<path>` | `lib:lib/pagination` | `exports`, `purpose` |
| `TypeModule` | `typemod:<path>` | `typemod:lib/types/archive` | `types` |
| `Type` | `type:<path>.<Name>` | `type:lib/types/archive.ArchiveEntry` | `kind`, `fields` |

### Shared

| Type | ID format | Example |
|------|-----------|---------|
| `TestFile` | `test:<repo-relative path with extension>` | `test:backend/tests/test_auth.py`, `test:frontend/e2e/auth.spec.ts` |
| `Domain` | `domain:<name>` | `domain:metadata` |
| `Layer` | `layer:<name>` | `layer:frontend-api` |
| `ExternalProvider` | `extprov:<Name>` | `extprov:IGDB` |

**Domains (19)**: admin, archive, artwork, audit, auth, collection, core, developer, franchise, genre, job, library, metadata, publisher, rbac, scan, search, storage, tag. Each has `domains/<name>.md`.

**Layers (16)**: api, service, repository, model, schema, task, provider, core, database, frontend-page, frontend-component, frontend-hook, frontend-context, frontend-api, frontend-lib, frontend-type.

---

## Relationship Types

### Backend

| Type | Source -> Target | Meaning |
|------|------------------|---------|
| `EXPOSES` | Router -> APIRoute | Router registers the route |
| `CALLS` | APIRoute -> Service/Repository/Provider | Handler (or a same-file helper it calls) uses the instance |
| `ACCEPTS` | APIRoute -> Schema | Request body schema |
| `RETURNS` | APIRoute -> Schema | `response_model` |
| `DEPENDS_ON` | Service/Provider -> Service/Repository/Provider | Architectural dependency |
| `USES_PROVIDER` | Service/Task -> Provider | Uses a metadata provider |
| `PROVIDES` | Provider -> ExternalProvider | Implements the external integration |
| `EXTENDS` | Class-like -> Class-like | Inheritance |
| `DISPATCHES` | Service/APIRoute -> Task | Enqueues a Celery task |
| `CONSUMES` | Task -> Service/Repository | Task body uses it |
| `READS` / `WRITES` / `ACCESSES` | Service/Repository -> DBTable | Data access (`ACCESSES` when read/write is not distinguished) |
| `DEFINES` | Model -> DBTable | Model maps the table |
| `MAPS_TO` | Schema -> Model | Schema represents the model |
| `NESTS` | Schema -> Schema | Schema embeds another schema |
| `USES_ENUM` | Model/Schema -> DBEnum | Column or field typed by the enum |
| `MANY_TO_ONE` / `ONE_TO_MANY` / `MANY_TO_MANY` | Model -> Model | ORM `relationship()` |
| `ASSOCIATED_THROUGH` | Model -> DBTable | `secondary=` association table |
| `IMPORTS` | code entity -> Module | File-level import of `app.core`, `app.utils`, `app.db` |
| `CREATES` | Migration -> DBTable | Revision creates the table |
| `FLOWS_TO` | APIRoute -> Repository/DBTable | Derived end-to-end flow (inferred) |

### Frontend

| Type | Source -> Target | Meaning |
|------|------------------|---------|
| `RENDERS` | Page/Layout/Component -> Component | Component used in JSX |
| `USES_HOOK` | Page/Component/Context -> Hook | |
| `USES_CONTEXT` | Page/Component/Hook -> Context | |
| `CALLS_API` | Page/Component/Hook/Context -> ApiFunction | Function actually invoked |
| `CALLS_ENDPOINT` | ApiFunction -> APIRoute | **Bridge between stacks** |
| `USES_CLIENT` | ApiModule -> `apimod:lib/api/client` | |
| `CONTAINS` | ApiModule -> ApiFunction, TypeModule -> Type | |
| `IMPORTS` | frontend entity -> LibUtil/TypeModule | |
| `MIRRORS` | Type -> Schema | TS type tracks a backend schema; `description` lists field mismatches |

### Shared

| Type | Source -> Target | Meaning |
|------|------------------|---------|
| `BELONGS_TO` | entity -> Domain / Layer | Exactly one of each for code entities (ADR-004) |
| `TESTS` | TestFile -> entity | Test file exercises the target |

---

## Common Queries

```bash
python docs/knowledge/queries/kg.py find ArchiveEntry          # locate entities
python docs/knowledge/queries/kg.py show service:app.services.metadata.MetadataService
python docs/knowledge/queries/kg.py files collection           # all files for a feature
python docs/knowledge/queries/kg.py trace page:/collections    # page -> apifn -> route -> service -> repo -> table
python docs/knowledge/queries/kg.py impact table:archive_entries
python docs/knowledge/queries/validate.py                      # check graph and docs against code
```
