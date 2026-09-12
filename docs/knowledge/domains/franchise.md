# Domain: Franchise

Game series. Franchises form a tree (`franchises.parent_id`; `child_ids` on `FranchiseRead`) and an archive entry points at one franchise via `archive_entries.franchise_id`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/franchises.py` | Router `/franchises` | `list_franchises`, `read_franchise`, `create_franchise`, `update_franchise`, `delete_franchise` |
| `backend/app/services/franchise.py` | Service | `FranchiseService.list_items`, `count`, `get`, `create`, `update`, `delete` |
| `backend/app/repositories/franchise.py` | Repository | `FranchiseRepository.get_by_name`, `list_items`, `count`, `count_entries_for_ids`, `count_entries_for_id` |
| `backend/app/models/franchise.py` | Model | `Franchise` |
| `backend/app/schemas/franchise.py` | Schemas | `FranchiseCreate`, `FranchiseUpdate`, `FranchiseRead` |
| `frontend/app/franchises/page.tsx` | List page | `franchisesApi.getAll`, `franchisesApi.getEntries` |
| `frontend/app/franchises/[id]/page.tsx` | Detail page | `franchisesApi.getById`, `franchisesApi.getEntries` |
| `frontend/components/common/relationship-visualizer.tsx` | Component | `RelationshipVisualizer` |
| `frontend/lib/api/franchises.ts` | API module | `franchisesApi.getAll`, `getById`, `getEntries` |
| `frontend/lib/types/franchise.ts` | Types | `Franchise` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.franchises` |
| Service | `service:app.services.franchise.FranchiseService` |
| Repository | `repo:app.repositories.franchise.FranchiseRepository` |
| Model | `model:app.models.franchise.Franchise` |
| Schema | `schema:app.schemas.franchise.FranchiseCreate`, `schema:app.schemas.franchise.FranchiseUpdate`, `schema:app.schemas.franchise.FranchiseRead` |
| Table | `table:franchises` |
| Page | `page:/franchises`, `page:/franchises/[id]` |
| Component | `comp:components/common/relationship-visualizer` |
| ApiModule | `apimod:lib/api/franchises` |
| TypeModule | `typemod:lib/types/franchise` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/franchises/` | `list_franchises` (`backend/app/api/franchises.py`) | authenticated | `apifn:lib/api/franchises.franchisesApi.getAll` |
| GET | `/api/franchises/{franchise_id}` | `read_franchise` (`backend/app/api/franchises.py`) | authenticated | `apifn:lib/api/franchises.franchisesApi.getById` |
| POST | `/api/franchises/` | `create_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | none |
| PATCH | `/api/franchises/{franchise_id}` | `update_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | none |
| DELETE | `/api/franchises/{franchise_id}` | `delete_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | none |

## Tables
`franchises` (hard delete: no `deleted_at` column), `archive_entries.franchise_id` (FK), `archive_entries` (read for counts), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New franchise field: `backend/app/models/franchise.py`, `FranchiseBase`/`FranchiseUpdate` in `backend/app/schemas/franchise.py`, migration in `backend/alembic/versions/`, `Franchise` in `frontend/lib/types/franchise.ts`.
- Frontend create/edit UI: add `create`/`update`/`remove` to `franchisesApi` in `frontend/lib/api/franchises.ts` (the backend routes already exist, gated by `EDIT_METADATA`).
- Server-side entry listing: add a route in `backend/app/api/franchises.py` that uses `ArchiveEntryRepository.search` (`franchise` name filter) and switch `franchisesApi.getEntries` to it.

## Notes
- `GET /api/franchises/` supports `offset`, `limit`, `q` (ILIKE on name) and sets `X-Total-Count`; `franchisesApi.getAll` uses `apiClient.getList` and returns `{ items, total }`.
- `FranchiseService.list_items` and `get` set a transient `entry_count`. `FranchiseRepository.count_entries_for_ids` counts non-deleted `archive_entries` rows grouped by `franchise_id`.
- Writes require `EDIT_METADATA`; the frontend has no create/update/delete calls for this domain.
- Tests: no dedicated backend test file.
- `franchisesApi.getEntries` delegates to `archiveApi.getByFranchise`, which matches `parent_series_id === id` or `franchise_id === id` on the first 1000 entries.
- The `franchise_entries` association table exists but no relationship uses it.
