# Domain: Collection

User-curated named sets of archive entries (`collections` + `collection_entries`). Reads need any authenticated user; writes need `MANAGE_COLLECTIONS`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/collections.py` | Router `/collections` | `list_collections`, `read_collection`, `create_collection`, `update_collection`, `delete_collection`, `add_entry_to_collection`, `remove_entry_from_collection` |
| `backend/app/services/collection.py` | Service | `CollectionService.list_items`, `get`, `create`, `update`, `delete`, `add_entry`, `remove_entry`, `_resolve_entries` |
| `backend/app/repositories/collection.py` | Repository | `CollectionRepository.list_active`, `get_active`, `get_by_name` |
| `backend/app/models/collection.py` | Model | `Collection` (`entry_ids` property) |
| `backend/app/schemas/collection.py` | Schemas | `CollectionCreate`, `CollectionUpdate`, `CollectionRead`, `CollectionEntryRequest` |
| `frontend/app/collections/page.tsx` | List page | `collectionsApi.getAll` |
| `frontend/app/collections/[id]/page.tsx` | Detail page | `collectionsApi.getById`, `archiveApi.getAll` |
| `frontend/app/collections/new/page.tsx` | Create page | `collectionsApi.create` |
| `frontend/app/collections/[id]/edit/page.tsx` | Edit page | `collectionsApi.getById`, `collectionsApi.update` |
| `frontend/app/admin/collections/page.tsx` | Admin page | `collectionsApi.getAll/create/update/remove/getEntries/removeEntry` |
| `frontend/components/common/collection-card.tsx` | Component | `CollectionCard` |
| `frontend/components/common/collection-stats.tsx` | Component | `CollectionStats`, `formatFileSize` |
| `frontend/components/common/collection-recommendations.tsx` | Component | `CollectionRecommendations` |
| `frontend/components/common/relationship-visualizer.tsx` | Component (also franchise) | `RelationshipVisualizer` |
| `frontend/lib/api/collections.ts` | API module | `collectionsApi` |
| `frontend/lib/types/collection.ts` | Types | `Collection`, `CollectionCreate`, `CollectionUpdate` |
| `backend/tests/test_collections_api.py` | Backend test | |
| `frontend/components/common/collection-stats.test.tsx`, `frontend/components/common/collection-recommendations.test.tsx`, `frontend/components/common/relationship-visualizer.test.tsx` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.collections` |
| Service | `service:app.services.collection.CollectionService` |
| Repository | `repo:app.repositories.collection.CollectionRepository` |
| Model | `model:app.models.collection.Collection` |
| Schema | `schema:app.schemas.collection.CollectionCreate`, `schema:app.schemas.collection.CollectionUpdate`, `schema:app.schemas.collection.CollectionRead`, `schema:app.schemas.collection.CollectionEntryRequest` |
| Table | `table:collections`, `table:collection_entries` |
| Page | `page:/collections`, `page:/collections/[id]`, `page:/collections/new`, `page:/collections/[id]/edit`, `page:/admin/collections` |
| Component | `comp:components/common/collection-card`, `comp:components/common/collection-stats`, `comp:components/common/collection-recommendations`, `comp:components/common/relationship-visualizer` |
| ApiModule | `apimod:lib/api/collections` |
| TypeModule | `typemod:lib/types/collection` |
| TestFile | `test:backend/tests/test_collections_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/collections/` | `list_collections` (`backend/app/api/collections.py`) | authenticated | `apifn:lib/api/collections.collectionsApi.getAll` |
| GET | `/api/collections/{collection_id}` | `read_collection` (`backend/app/api/collections.py`) | authenticated | `apifn:lib/api/collections.collectionsApi.getById` |
| POST | `/api/collections/` | `create_collection` (`backend/app/api/collections.py`) | MANAGE_COLLECTIONS | `apifn:lib/api/collections.collectionsApi.create` |
| PATCH | `/api/collections/{collection_id}` | `update_collection` (`backend/app/api/collections.py`) | MANAGE_COLLECTIONS | `apifn:lib/api/collections.collectionsApi.update` |
| DELETE | `/api/collections/{collection_id}` | `delete_collection` (`backend/app/api/collections.py`) | MANAGE_COLLECTIONS | `apifn:lib/api/collections.collectionsApi.remove` |
| POST | `/api/collections/{collection_id}/entries` | `add_entry_to_collection` (`backend/app/api/collections.py`) | MANAGE_COLLECTIONS | `apifn:lib/api/collections.collectionsApi.addEntry` |
| DELETE | `/api/collections/{collection_id}/entries/{entry_id}` | `remove_entry_from_collection` (`backend/app/api/collections.py`) | MANAGE_COLLECTIONS | `apifn:lib/api/collections.collectionsApi.removeEntry` |

## Tables
`collections` (soft delete via `deleted_at`), `collection_entries`, `archive_entries` (read), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New collection field: `backend/app/models/collection.py`, `CollectionBase`/`CollectionUpdate` in `backend/app/schemas/collection.py`, migration in `backend/alembic/versions/`, `frontend/lib/types/collection.ts`, forms in `frontend/app/collections/new/page.tsx` and `frontend/app/collections/[id]/edit/page.tsx`.
- Server-side entry listing (replacing the client filter): add a route in `backend/app/api/collections.py`, then point `collectionsApi.getEntries` in `frontend/lib/api/collections.ts` at it.
- Search by collection name already exists in `ArchiveEntryRepository.search` (`collection` arg) but is not exposed by `GET /api/search/`; expose it in `backend/app/api/search.py` and `SearchService.search`.

## Notes
- `CollectionService.add_entry`/`remove_entry` raise `ValueError` (400) for unknown or soft-deleted entries; adding an existing member is a no-op.
- `collectionsApi.getEntries` filters `archiveApi.getAll(0, 1000)` by `collection_ids` client side.
- `GET /api/collections/` supports `q` (name filter) and returns no `X-Total-Count` header.
