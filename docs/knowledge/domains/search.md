# Domain: Search

Archive entry search with a text query and exact-name filters, plus the frontend search page that fans out to several list endpoints and merges the results.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/search.py` | Router `/search` | `search_archive_entries` |
| `backend/app/services/search.py` | Service (pass-through) | `SearchService.search` |
| `backend/app/repositories/archive_entry.py` | Query | `ArchiveEntryRepository.search` |
| `frontend/app/search/page.tsx` | Search page | `searchApi.search` |
| `frontend/components/common/advanced-search-builder.tsx` | Component | `AdvancedSearchBuilder`, `SEARCH_FIELD_LABELS`, `SearchCondition` |
| `frontend/lib/api/search.ts` | Aggregating API module | `searchApi.search` |
| `frontend/lib/api/archives.ts` | Calls the endpoint | `archiveApi.search` |
| `frontend/lib/saved-searches.ts` | localStorage saved searches | `loadSavedSearches`, `saveSearch`, `deleteSavedSearch`, `loadSearchState`, `saveSearchState` |
| `frontend/lib/types/search.ts` | Types | `SearchResults`, `SearchFilters` |
| `frontend/app/search/page.test.tsx`, `frontend/components/common/advanced-search-builder.test.tsx`, `frontend/lib/saved-searches.test.ts` | Frontend tests | |
| `backend/tests/test_e2e.py` | Backend test (`test_search_journey`) | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.search` |
| Service | `service:app.services.search.SearchService` |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository` |
| Schema | `schema:app.schemas.archive_entry.ArchiveEntryRead` |
| Page | `page:/search` |
| Component | `comp:components/common/advanced-search-builder` |
| ApiModule | `apimod:lib/api/search` |
| ApiFunction | `apifn:lib/api/search.searchApi.search`, `apifn:lib/api/archives.archiveApi.search` |
| LibUtil | `lib:lib/saved-searches` |
| TypeModule | `typemod:lib/types/search` |
| TestFile | `test:frontend/app/search/page.test.tsx`, `test:backend/tests/test_e2e.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/search/` | `search_archive_entries` (`backend/app/api/search.py`) | authenticated | `apifn:lib/api/archives.archiveApi.search` |

## Tables
Read only: `archive_entries`, `archive_entry_tags`, `archive_entry_developers`, `archive_entry_publishers`, `archive_entry_genres`, `collection_entries`, `tags`, `developers`, `publishers`, `genres`, `collections`, `franchises`.

## Change guide
- New filter: add the query param to `search_archive_entries` (`backend/app/api/search.py`), `SearchService.search`, and `ArchiveEntryRepository.search`; then `archiveApi.search` (`frontend/lib/api/archives.ts`) and `SearchFilters` (`frontend/lib/types/search.ts`).
- New result section on the search page: add a request in `searchApi.search` (`frontend/lib/api/search.ts`) and a field on `SearchResults`.

## Notes
- `q` is a case-insensitive `ILIKE '%q%'` over entry title and description plus collection, developer, publisher and tag names (UNION subquery). It does not use `pg_trgm`, although the extension is created in `backend/app/db/base.py` and the baseline migration.
- `genre`, `tag`, `developer`, `publisher`, `franchise` are exact name matches; `storage_device` is ILIKE; `metadata_status` and `verification_status` are equality.
- `ArchiveEntryRepository.search` accepts `collection`, but `SearchService.search` and the route never pass it.
- `archiveApi.search` sends only the first value of each `SearchFilters` array and defaults to `limit=200`.
- `searchApi.search` runs 6 requests in parallel: `archiveApi.search`, `collectionsApi.getAll`, `developersApi.getAll`, `publishersApi.getAll`, `tagsApi.getAll`, `franchisesApi.getAll` (each with `q`).
- `GET /api/search/` sets no `X-Total-Count` header.
