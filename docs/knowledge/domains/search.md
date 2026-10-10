# Domain: Search

Archive entry search with a text query and exact-name filters, plus the frontend search page that fans out to several list endpoints and merges the results.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/search.py` | Router `/search` | `search_archive_entries` |
| `backend/app/services/search.py` | Service (pass-through) | `SearchService.search` |
| `backend/app/repositories/archive_entry.py` | Query | `ArchiveEntryRepository.search` |
| `frontend/lib/api/archives.ts` | Calls the endpoint | `archiveApi.search` |
| `frontend/lib/types/search.ts` | Types | `SearchResults`, `SearchFilters` |
| `backend/tests/test_e2e.py` | Backend test (`test_search_journey`) | |
| `frontend/components/shell/command-palette.tsx` | Component | `CommandPalette` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.search` |
| Service | `service:app.services.search.SearchService` |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository` |
| Schema | `schema:app.schemas.archive_entry.ArchiveEntryRead` |
| TypeModule | `typemod:lib/types/search` |
| TestFile | `test:backend/tests/test_e2e.py` |
| Component | `comp:components/shell/command-palette` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/search/` | `search_archive_entries` (`backend/app/api/search.py`) | authenticated |  |

## Tables
Read only: `archive_entries`, `archive_entry_tags`, `archive_entry_developers`, `archive_entry_publishers`, `archive_entry_genres`, `collection_entries`, `tags`, `developers`, `publishers`, `genres`, `collections`, `franchises`.

## Change guide
- New filter: add the query param to `search_archive_entries` (`backend/app/api/search.py`), `SearchService.search`, and `ArchiveEntryRepository.search`; then `archiveApi.search` (`frontend/lib/api/archives.ts`) and `SearchFilters` (`frontend/lib/types/search.ts`).
- New search filter: add it to `LibraryQuery` and `archiveApi.browse` (`frontend/lib/api/archives.ts`) and to `search_archive_entries` on the backend.

## Notes
- `q` is a case-insensitive `ILIKE '%q%'` over entry title and description plus collection, developer, publisher and tag names (UNION subquery). It does not use `pg_trgm`, although the extension is created in `backend/app/db/base.py` and the baseline migration.
- `genre`, `tag`, `developer`, `publisher`, `franchise` are exact name matches; `storage_device` is ILIKE; `metadata_status` and `verification_status` are equality.
- `ArchiveEntryRepository.search` accepts `collection`, but `SearchService.search` and the route never pass it.
- `archiveApi.search` sends only the first value of each `SearchFilters` array and defaults to `limit=200`.
- `searchApi.search` runs 6 requests in parallel: `archiveApi.search`, `collectionsApi.getAll`, `developersApi.getAll`, `publishersApi.getAll`, `tagsApi.getAll`, `franchisesApi.getAll` (each with `q`).
- `GET /api/search/` sets no `X-Total-Count` header.
