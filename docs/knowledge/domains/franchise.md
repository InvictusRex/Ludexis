# Domain: Franchise

Game series. Franchises form a tree (`franchises.parent_id`; `child_ids` on `FranchiseRead`) and an archive entry points at one franchise via `archive_entries.franchise_id`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/franchises.py` | Router `/franchises` | `list_franchises`, `read_franchise`, `create_franchise`, `update_franchise`, `delete_franchise`, `list_franchise_image_candidates`, `choose_franchise_image`, `upload_franchise_image`, `reset_franchise_image` |
| `backend/app/services/franchise.py` | Service | `FranchiseService.list_items`, `count`, `get`, `create`, `update`, `delete`, `image_candidates`, `set_image`, `upload_image`, `clear_image` |
| `backend/app/repositories/franchise.py` | Repository | `FranchiseRepository.get_by_name`, `list_items`, `count`, `count_entries_for_ids`, `count_entries_for_id`, `auto_images`, `visible_entries` |
| `backend/app/models/franchise.py` | Model | `Franchise` |
| `backend/app/schemas/franchise.py` | Schemas | `FranchiseCreate`, `FranchiseUpdate`, `FranchiseRead`, `FranchiseImageSource` |
| `frontend/app/(app)/franchises/page.tsx` | List page | `franchisesApi.getAll`, `franchisesApi.getEntries` |
| `frontend/app/(app)/franchises/[id]/page.tsx` | Detail page | `franchisesApi.getById`, `franchisesApi.getEntries` |
| `frontend/components/browse/franchise-card.tsx` | Card (home row and franchises page) | `FranchiseCard`, `FRANCHISE_CARD_WIDTH` |
| `frontend/components/browse/franchise-image-dialog.tsx` | Image picker on the detail page | `FranchiseImageDialog` |
| `frontend/lib/api/franchises.ts` | API module | `franchisesApi.getAll`, `getById`, `create`, `update`, `delete`, `imageCandidates`, `chooseImage`, `uploadImage`, `resetImage` |
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
| ApiModule | `apimod:lib/api/franchises` |
| TypeModule | `typemod:lib/types/franchise` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/franchises/` | `list_franchises` (`backend/app/api/franchises.py`) | authenticated | `apifn:lib/api/franchises.franchisesApi.getAll` |
| GET | `/api/franchises/{franchise_id}` | `read_franchise` (`backend/app/api/franchises.py`) | authenticated | `apifn:lib/api/franchises.franchisesApi.getById` |
| POST | `/api/franchises/` | `create_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | none |
| PATCH | `/api/franchises/{franchise_id}` | `update_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | none |
| DELETE | `/api/franchises/{franchise_id}` | `delete_franchise` (`backend/app/api/franchises.py`) | EDIT_METADATA | `apifn:lib/api/franchises.franchisesApi.delete` |
| GET | `/api/franchises/{franchise_id}/image-candidates` | `list_franchise_image_candidates` | EDIT_METADATA | `apifn:lib/api/franchises.franchisesApi.imageCandidates` |
| PUT | `/api/franchises/{franchise_id}/image` | `choose_franchise_image` | EDIT_METADATA | `apifn:lib/api/franchises.franchisesApi.chooseImage` |
| POST | `/api/franchises/{franchise_id}/image` | `upload_franchise_image` | EDIT_METADATA | `apifn:lib/api/franchises.franchisesApi.uploadImage` |
| DELETE | `/api/franchises/{franchise_id}/image` | `reset_franchise_image` | EDIT_METADATA | `apifn:lib/api/franchises.franchisesApi.resetImage` |

## Tables
`franchises` (hard delete: no `deleted_at` column), `archive_entries.franchise_id` (FK), `archive_entries` (read for counts), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New franchise field: `backend/app/models/franchise.py`, `FranchiseBase`/`FranchiseUpdate` in `backend/app/schemas/franchise.py`, migration in `backend/alembic/versions/`, `Franchise` in `frontend/lib/types/franchise.ts`.
- Frontend create/edit UI: add `create`/`update`/`remove` to `franchisesApi` in `frontend/lib/api/franchises.ts` (the backend routes already exist, gated by `EDIT_METADATA`).
- Server-side entry listing: add a route in `backend/app/api/franchises.py` that uses `ArchiveEntryRepository.search` (`franchise` name filter) and switch `franchisesApi.getEntries` to it.

## Notes
- `GET /api/franchises/` supports `offset`, `limit`, `q` (ILIKE on name) and sets `X-Total-Count`; `franchisesApi.getAll` uses `apiClient.getList` and returns `{ items, total }`.
- `FranchiseService.list_items` and `get` set a transient `entry_count`. `FranchiseRepository.count_entries_for_ids` counts non-deleted `archive_entries` rows grouped by `franchise_id`.
- Writes require `EDIT_METADATA`.
- Images: `banner_path` is the chosen image, always a copy under `franchises/<id>/` in artwork storage, so replacing a game's art never breaks it; `garbage_collect_artwork` keeps it. `image_path` (read only) is what cards show: `banner_path`, else `FranchiseRepository.auto_images`, the banner of the first released game the viewer can see. Candidates are the viewer's visible games' banners, SteamGridDB heroes for a game named exactly like the franchise, then the games' screenshots; only an offered candidate can be chosen. Create and update no longer accept `banner_path`.
- The franchises page (`TaxonomyIndex` with `cards: true`) shows `FranchiseCard`s at the home row's width instead of the A to Z list.
- Tests: `backend/tests/test_franchises_api.py`, `frontend/components/browse/franchise-image-dialog.test.tsx`.
- `franchisesApi.getEntries` delegates to `archiveApi.getByFranchise`, which matches `parent_series_id === id` or `franchise_id === id` on the first 1000 entries.
- The `franchise_entries` association table exists but no relationship uses it.
