# Domain: Archive

`ArchiveEntry` is the central record: one game archive file or folder plus metadata, artwork paths, verification state and many-to-many links to tags, developers, publishers, collections, genres and related entries. This domain owns CRUD, manual metadata override, the duplicate listing and the library browsing UI.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/archive_entries.py` | Router `/archive-entries` | `list_archive_entries`, `list_duplicates`, `list_screenshots`, `read_archive_entry`, `create_archive_entry`, `update_archive_entry`, `override_archive_metadata`, `delete_archive_entry` |
| `backend/app/services/archive_entry.py` | Service | `ArchiveEntryService.list_entries`, `get`, `create`, `update`, `delete`, `update_metadata`, `_assign_relations`, `_resolve_list` |
| `backend/app/repositories/archive_entry.py` | Repository | `ArchiveEntryRepository.list_active`, `get_active`, `get_by_file_path`, `get_by_hash`, `get_by_title_and_version`, `list_titles`, `list_all`, `search`, `get_all_by_hash`, `list_with_hashes` |
| `backend/app/models/archive_entry.py` | Model | `ArchiveEntry` |
| `backend/app/models/note.py`, `backend/app/models/rating.py` | Models (no API) | `Note`, `Rating` |
| `backend/app/models/association_tables.py` | Join tables | `archive_entry_tags`, `archive_entry_developers`, `archive_entry_publishers`, `archive_entry_genres`, `collection_entries`, `archive_entry_relations`, `franchise_entries` |
| `backend/app/schemas/archive_entry.py` | Schemas | `ArchiveEntryCreate`, `ArchiveEntryUpdate`, `ArchiveEntryRead`, `ArchiveMetadataUpdate`, `ArchiveEntryReference` |
| `backend/app/schemas/duplicates.py` | Schemas | `DuplicateGroup`, `DuplicateArchiveEntry` |
| `backend/app/schemas/screenshot.py` | Schema | `ScreenshotRead` |
| `backend/app/utils/enums.py` | Enums | `MetadataStatus`, `VerificationStatus`, `RelationshipType` |
| `frontend/app/page.tsx` | Home dashboard | `archiveApi.getAll`, `collectionsApi.getAll`, `developersApi.getAll`, `franchisesApi.getAll`, `tagsApi.getAll` |
| `frontend/app/library/page.tsx` | Library browser | `archiveApi.search`, `archiveApi.delete`, `collectionsApi.addEntry` |
| `frontend/app/archive/[id]/page.tsx` | Entry detail | `archiveApi.getById`, `archiveApi.getScreenshots`, `archiveApi.delete` |
| `frontend/app/admin/duplicates/page.tsx` | Duplicate review | `archiveApi.getDuplicates`, `archiveApi.delete` |
| `frontend/components/common/archive-entry-card.tsx` | Component | `ArchiveEntryCard` |
| `frontend/components/common/bulk-action-bar.tsx` | Component | `BulkActionBar` |
| `frontend/components/common/duplicate-group-card.tsx` | Component | `DuplicateGroupCard` |
| `frontend/components/common/archive-edit-dialog.tsx` | Component (unused by pages) | `ArchiveEditDialog` |
| `frontend/lib/api/archives.ts` | API module | `archiveApi` |
| `frontend/lib/types/archive.ts` | Types | `ArchiveEntry`, `DuplicateGroup`, `DuplicateArchiveEntry`, `Screenshot`, `ArchiveMetadataUpdate`, `MetadataStatus`, `VerificationStatus` |
| `backend/tests/test_archive_entries_api.py` | Backend test | |
| `frontend/components/common/archive-entry-card.test.tsx`, `frontend/components/common/archive-edit-dialog.test.tsx`, `frontend/components/common/bulk-action-bar.test.tsx`, `frontend/components/common/duplicate-group-card.test.tsx`, `frontend/e2e/duplicates.spec.ts` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.archive_entries` |
| Service | `service:app.services.archive_entry.ArchiveEntryService` |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository` |
| Model | `model:app.models.archive_entry.ArchiveEntry`, `model:app.models.note.Note`, `model:app.models.rating.Rating` |
| Schema | `schema:app.schemas.archive_entry.ArchiveEntryCreate`, `schema:app.schemas.archive_entry.ArchiveEntryUpdate`, `schema:app.schemas.archive_entry.ArchiveEntryRead`, `schema:app.schemas.archive_entry.ArchiveMetadataUpdate`, `schema:app.schemas.duplicates.DuplicateGroup` |
| DBEnum | `dbenum:metadata_status`, `dbenum:verification_status`, `dbenum:relationship_type` |
| Table | `table:archive_entries`, `table:notes`, `table:ratings`, `table:archive_entry_relations` |
| Page | `page:/`, `page:/library`, `page:/archive/[id]`, `page:/admin/duplicates` |
| Component | `comp:components/common/archive-entry-card`, `comp:components/common/bulk-action-bar`, `comp:components/common/duplicate-group-card`, `comp:components/common/archive-edit-dialog` |
| ApiModule | `apimod:lib/api/archives` |
| TypeModule | `typemod:lib/types/archive` |
| TestFile | `test:backend/tests/test_archive_entries_api.py`, `test:frontend/e2e/duplicates.spec.ts` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/archive-entries/` | `list_archive_entries` (`backend/app/api/archive_entries.py`) | authenticated | `apifn:lib/api/archives.archiveApi.getAll` |
| GET | `/api/archive-entries/duplicates` | `list_duplicates` (`backend/app/api/archive_entries.py`) | authenticated | `apifn:lib/api/archives.archiveApi.getDuplicates` |
| GET | `/api/archive-entries/{archive_entry_id}/screenshots` | `list_screenshots` (`backend/app/api/archive_entries.py`) | authenticated | `apifn:lib/api/archives.archiveApi.getScreenshots` |
| GET | `/api/archive-entries/{archive_entry_id}` | `read_archive_entry` (`backend/app/api/archive_entries.py`) | authenticated | `apifn:lib/api/archives.archiveApi.getById` |
| POST | `/api/archive-entries/` | `create_archive_entry` (`backend/app/api/archive_entries.py`) | EDIT_METADATA | none |
| PATCH | `/api/archive-entries/{archive_entry_id}` | `update_archive_entry` (`backend/app/api/archive_entries.py`) | EDIT_METADATA | `apifn:lib/api/archives.archiveApi.update` |
| PATCH | `/api/archive-entries/{archive_entry_id}/metadata` | `override_archive_metadata` (`backend/app/api/archive_entries.py`) | EDIT_METADATA | `apifn:lib/api/archives.archiveApi.updateMetadata` |
| DELETE | `/api/archive-entries/{archive_entry_id}` | `delete_archive_entry` (`backend/app/api/archive_entries.py`) | EDIT_METADATA | `apifn:lib/api/archives.archiveApi.delete` |

## Tables
`archive_entries` (soft delete via `deleted_at`), `archive_entry_tags`, `archive_entry_developers`, `archive_entry_publishers`, `collection_entries`, `archive_entry_relations` (written by `_assign_relations`), `screenshots` (read), `audit_logs` (writes via `AuditService.record`). `notes`, `ratings` have models only.

## Change guide
- New `ArchiveEntry` column: `backend/app/models/archive_entry.py`, `ArchiveEntryBase`/`ArchiveEntryUpdate` in `backend/app/schemas/archive_entry.py`, migration in `backend/alembic/versions/`, `ArchiveEntry` in `frontend/lib/types/archive.ts`, display in `frontend/app/archive/[id]/page.tsx`.
- New many-to-many link: table in `backend/app/models/association_tables.py`, relationship on `ArchiveEntry`, `*_ids` field in `ArchiveEntryCreate` plus the exclude set in `ArchiveEntryService.create/update`, resolution in `ArchiveEntryService._assign_relations`, computed id list on `ArchiveEntryRead`.
- New list filter: `ArchiveEntryRepository.search` + `SearchService.search` + `backend/app/api/search.py` (see search domain) and `archiveApi.search` in `frontend/lib/api/archives.ts`.
- New manual-override field: `ArchiveMetadataUpdate` + `ArchiveEntryService.update_metadata`, frontend `ArchiveMetadataUpdate` type, caller `frontend/app/admin/metadata/page.tsx`.

## Notes
- `PATCH /api/archive-entries/{archive_entry_id}` is a partial update: `ArchiveEntryService.update` dumps with `exclude_unset=True`, and `_assign_relations` only replaces a relation list (`tag_ids`, `developer_ids`, ...) when it is present in `data.model_fields_set`. Sending `null` explicitly still writes `None`.
- `ArchiveEntryService.update_metadata` sets `metadata_override` from the payload and forces `metadata_status = MANUAL`; `MetadataService.refresh_archive`/`auto_match_archive` skip entries with `metadata_override`.
- `GET /api/archive-entries/duplicates` groups by `file_hash` via `ScannerService.find_duplicates` (scan domain); the duplicates page deletes entries one by one with `archiveApi.delete`.
- `ArchiveEntryRead` exposes computed `tag_ids`, `developer_ids`, `publisher_ids`, `collection_ids`; genres are not exposed in the schema.
- `archiveApi.getByDeveloper/getByPublisher/getByTag/getByFranchise` and `collectionsApi.getEntries` fetch the first 1000 entries (`archiveApi.getAll(0, 1000)`) and filter client side.
- `franchise_entries` is defined but no relationship uses it; franchise membership is `archive_entries.franchise_id`.
- Archive writes audit through `AuditService.record` with plain strings (`"create"`, `"update"`, `"delete"`, `"MANUAL_METADATA_OVERRIDE"`), not `AuditAction` constants.
