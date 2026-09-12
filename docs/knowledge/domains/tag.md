# Domain: Tag

Free-form labels (`tags`, with optional `color`) attached to archive entries through `archive_entry_tags`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/tags.py` | Router `/tags` | `list_tags`, `read_tag`, `create_tag`, `update_tag`, `delete_tag` |
| `backend/app/services/tag.py` | Service | `TagService.list_items`, `count`, `get`, `create`, `update`, `delete` |
| `backend/app/repositories/tag.py` | Repository | `TagRepository.get_by_name`, `list_items`, `count`, `count_entries_for_ids`, `count_entries_for_id` |
| `backend/app/models/tag.py` | Model | `Tag` |
| `backend/app/schemas/tag.py` | Schemas | `TagCreate`, `TagUpdate`, `TagRead` |
| `frontend/app/tags/page.tsx` | List page | `tagsApi.getAll` |
| `frontend/app/tags/[id]/page.tsx` | Detail page | `tagsApi.getById`, `tagsApi.getEntries`, `tagsApi.getRelatedTags` |
| `frontend/components/common/tag-card.tsx` | Component | `TagCard` |
| `frontend/lib/api/tags.ts` | API module | `tagsApi.getAll`, `getById`, `getEntries`, `getRelatedTags` |
| `frontend/lib/types/tag.ts` | Types | `Tag` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.tags` |
| Service | `service:app.services.tag.TagService` |
| Repository | `repo:app.repositories.tag.TagRepository` |
| Model | `model:app.models.tag.Tag` |
| Schema | `schema:app.schemas.tag.TagCreate`, `schema:app.schemas.tag.TagUpdate`, `schema:app.schemas.tag.TagRead` |
| Table | `table:tags`, `table:archive_entry_tags` |
| Page | `page:/tags`, `page:/tags/[id]` |
| Component | `comp:components/common/tag-card` |
| ApiModule | `apimod:lib/api/tags` |
| TypeModule | `typemod:lib/types/tag` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/tags/` | `list_tags` (`backend/app/api/tags.py`) | authenticated | `apifn:lib/api/tags.tagsApi.getAll` |
| GET | `/api/tags/{tag_id}` | `read_tag` (`backend/app/api/tags.py`) | authenticated | `apifn:lib/api/tags.tagsApi.getById` |
| POST | `/api/tags/` | `create_tag` (`backend/app/api/tags.py`) | EDIT_METADATA | none |
| PATCH | `/api/tags/{tag_id}` | `update_tag` (`backend/app/api/tags.py`) | EDIT_METADATA | none |
| DELETE | `/api/tags/{tag_id}` | `delete_tag` (`backend/app/api/tags.py`) | EDIT_METADATA | none |

## Tables
`tags` (hard delete: no `deleted_at` column), `archive_entry_tags`, `archive_entries` (read for counts), `audit_logs` (writes via `AuditService.record`).

## Change guide
- New tag field: `backend/app/models/tag.py`, `TagBase`/`TagUpdate` in `backend/app/schemas/tag.py`, migration in `backend/alembic/versions/`, `Tag` in `frontend/lib/types/tag.ts`.
- Frontend create/edit UI: add `create`/`update`/`remove` to `tagsApi` in `frontend/lib/api/tags.ts` (the backend routes already exist, gated by `EDIT_METADATA`).
- Server-side entry listing: add a route in `backend/app/api/tags.py` that uses `ArchiveEntryRepository.search` (`tag` name filter) and switch `tagsApi.getEntries` to it.

## Notes
- `GET /api/tags/` supports `offset`, `limit`, `q` (ILIKE on name) and sets `X-Total-Count`; `tagsApi.getAll` uses `apiClient.getList` and returns `{ items, total }`.
- `TagService.list_items` and `get` set a transient `entry_count`. `TagRepository.count_entries_for_ids` counts rows in `archive_entry_tags` joined to non-deleted entries.
- Writes require `EDIT_METADATA`; the frontend has no create/update/delete calls for this domain.
- Tests: `backend/tests/test_permissions.py` exercises the `POST /api/tags/` permission check.
- `tagsApi.getRelatedTags` is a placeholder: it returns the first 6 other tags from `tagsApi.getAll()`.
- `tagsApi.getEntries` delegates to `archiveApi.getByTag` (client-side filter of the first 1000 entries).
