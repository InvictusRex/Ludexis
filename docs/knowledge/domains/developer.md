# Domain: Developer

Game development studios linked to archive entries through `archive_entry_developers`. Also created implicitly by metadata refresh (`MetadataService._sync_developers`).

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/developers.py` | Router `/developers` | `list_developers`, `read_developer`, `create_developer`, `update_developer`, `delete_developer` |
| `backend/app/services/developer.py` | Service | `DeveloperService.list_items`, `count`, `get`, `create`, `update`, `delete` |
| `backend/app/repositories/developer.py` | Repository | `DeveloperRepository.get_by_name`, `list_items`, `count`, `count_entries_for_ids`, `count_entries_for_id` |
| `backend/app/models/developer.py` | Model | `Developer` |
| `backend/app/schemas/developer.py` | Schemas | `DeveloperCreate`, `DeveloperUpdate`, `DeveloperRead` |
| `frontend/app/developers/page.tsx` | List page | `developersApi.getAll` |
| `frontend/app/developers/[id]/page.tsx` | Detail page | `developersApi.getById`, `developersApi.getEntries` |
| `frontend/components/common/developer-card.tsx` | Component | `DeveloperCard` |
| `frontend/lib/api/developers.ts` | API module | `developersApi.getAll`, `getById`, `getEntries` |
| `frontend/lib/types/developer.ts` | Types | `Developer` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.developers` |
| Service | `service:app.services.developer.DeveloperService` |
| Repository | `repo:app.repositories.developer.DeveloperRepository` |
| Model | `model:app.models.developer.Developer` |
| Schema | `schema:app.schemas.developer.DeveloperCreate`, `schema:app.schemas.developer.DeveloperUpdate`, `schema:app.schemas.developer.DeveloperRead` |
| Table | `table:developers`, `table:archive_entry_developers` |
| Page | `page:/developers`, `page:/developers/[id]` |
| Component | `comp:components/common/developer-card` |
| ApiModule | `apimod:lib/api/developers` |
| TypeModule | `typemod:lib/types/developer` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/developers/` | `list_developers` (`backend/app/api/developers.py`) | authenticated | `apifn:lib/api/developers.developersApi.getAll` |
| GET | `/api/developers/{developer_id}` | `read_developer` (`backend/app/api/developers.py`) | authenticated | `apifn:lib/api/developers.developersApi.getById` |
| POST | `/api/developers/` | `create_developer` (`backend/app/api/developers.py`) | EDIT_METADATA | none |
| PATCH | `/api/developers/{developer_id}` | `update_developer` (`backend/app/api/developers.py`) | EDIT_METADATA | none |
| DELETE | `/api/developers/{developer_id}` | `delete_developer` (`backend/app/api/developers.py`) | EDIT_METADATA | none |

## Tables
`developers` (hard delete: no `deleted_at` column), `archive_entry_developers`, `archive_entries` (read for counts), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New developer field: `backend/app/models/developer.py`, `DeveloperBase`/`DeveloperUpdate` in `backend/app/schemas/developer.py`, migration in `backend/alembic/versions/`, `Developer` in `frontend/lib/types/developer.ts`.
- Frontend create/edit UI: add `create`/`update`/`remove` to `developersApi` in `frontend/lib/api/developers.ts` (the backend routes already exist, gated by `EDIT_METADATA`).
- Server-side entry listing: add a route in `backend/app/api/developers.py` that uses `ArchiveEntryRepository.search` (`developer` name filter) and switch `developersApi.getEntries` to it.

## Notes
- `GET /api/developers/` supports `offset`, `limit`, `q` (ILIKE on name) and sets `X-Total-Count`; `developersApi.getAll` uses `apiClient.getList` and returns `{ items, total }`.
- `DeveloperService.list_items` and `get` set a transient `entry_count`. `DeveloperRepository.count_entries_for_ids` counts rows in `archive_entry_developers` joined to non-deleted entries.
- Writes require `EDIT_METADATA`; the frontend has no create/update/delete calls for this domain.
- Tests: no dedicated backend test file.
- `developersApi.getEntries` delegates to `archiveApi.getByDeveloper` (client-side filter of the first 1000 entries).
- `frontend/app/archive/[id]/page.tsx` resolves developer names with `developersApi.getById` per id.
- `developers.name_key` (unique) holds `company_key(name)`, set by a `@validates("name")` hook; `DeveloperRepository.get_by_name` matches on it, so "SEGA" and "Sega" are one developer. Create and rename return 400 when another developer has the same key.
