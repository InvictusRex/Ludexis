# Domain: Publisher

Game publishers linked to archive entries through `archive_entry_publishers`. Also created implicitly by metadata refresh (`MetadataService._sync_publishers`).

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/publishers.py` | Router `/publishers` | `list_publishers`, `read_publisher`, `create_publisher`, `update_publisher`, `delete_publisher` |
| `backend/app/services/publisher.py` | Service | `PublisherService.list_items`, `count`, `get`, `create`, `update`, `delete` |
| `backend/app/repositories/publisher.py` | Repository | `PublisherRepository.get_by_name`, `list_items`, `count`, `count_entries_for_ids`, `count_entries_for_id` |
| `backend/app/models/publisher.py` | Model | `Publisher` |
| `backend/app/schemas/publisher.py` | Schemas | `PublisherCreate`, `PublisherUpdate`, `PublisherRead` |
| `frontend/app/publishers/page.tsx` | List page | `publishersApi.getAll` |
| `frontend/app/publishers/[id]/page.tsx` | Detail page | `publishersApi.getById`, `publishersApi.getEntries` |
| `frontend/lib/api/publishers.ts` | API module | `publishersApi.getAll`, `getById`, `getEntries` |
| `frontend/lib/types/publisher.ts` | Types | `Publisher` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.publishers` |
| Service | `service:app.services.publisher.PublisherService` |
| Repository | `repo:app.repositories.publisher.PublisherRepository` |
| Model | `model:app.models.publisher.Publisher` |
| Schema | `schema:app.schemas.publisher.PublisherCreate`, `schema:app.schemas.publisher.PublisherUpdate`, `schema:app.schemas.publisher.PublisherRead` |
| Table | `table:publishers`, `table:archive_entry_publishers` |
| Page | `page:/publishers`, `page:/publishers/[id]` |
| ApiModule | `apimod:lib/api/publishers` |
| TypeModule | `typemod:lib/types/publisher` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/publishers/` | `list_publishers` (`backend/app/api/publishers.py`) | authenticated | `apifn:lib/api/publishers.publishersApi.getAll` |
| GET | `/api/publishers/{publisher_id}` | `read_publisher` (`backend/app/api/publishers.py`) | authenticated | `apifn:lib/api/publishers.publishersApi.getById` |
| POST | `/api/publishers/` | `create_publisher` (`backend/app/api/publishers.py`) | EDIT_METADATA | none |
| PATCH | `/api/publishers/{publisher_id}` | `update_publisher` (`backend/app/api/publishers.py`) | EDIT_METADATA | none |
| DELETE | `/api/publishers/{publisher_id}` | `delete_publisher` (`backend/app/api/publishers.py`) | EDIT_METADATA | none |

## Tables
`publishers` (hard delete: no `deleted_at` column), `archive_entry_publishers`, `archive_entries` (read for counts), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New publisher field: `backend/app/models/publisher.py`, `PublisherBase`/`PublisherUpdate` in `backend/app/schemas/publisher.py`, migration in `backend/alembic/versions/`, `Publisher` in `frontend/lib/types/publisher.ts`.
- Frontend create/edit UI: add `create`/`update`/`remove` to `publishersApi` in `frontend/lib/api/publishers.ts` (the backend routes already exist, gated by `EDIT_METADATA`).
- Server-side entry listing: add a route in `backend/app/api/publishers.py` that uses `ArchiveEntryRepository.search` (`publisher` name filter) and switch `publishersApi.getEntries` to it.

## Notes
- `GET /api/publishers/` supports `offset`, `limit`, `q` (ILIKE on name) and sets `X-Total-Count`; `publishersApi.getAll` uses `apiClient.getList` and returns `{ items, total }`.
- `PublisherService.list_items` and `get` set a transient `entry_count`. `PublisherRepository.count_entries_for_ids` counts rows in `archive_entry_publishers` joined to non-deleted entries.
- Writes require `EDIT_METADATA`; the frontend has no create/update/delete calls for this domain.
- Tests: no dedicated backend test file.
- `publishersApi.getEntries` delegates to `archiveApi.getByPublisher` (client-side filter of the first 1000 entries).
- There is no publisher card component; `frontend/app/publishers/page.tsx` renders its own markup.
- `frontend/app/archive/[id]/page.tsx` resolves publisher names with `publishersApi.getById` per id.
