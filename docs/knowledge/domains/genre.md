# Domain: Genre

Genre labels attached to archive entries through `archive_entry_genres`. Genres have no router, service or frontend module: metadata refresh creates and links them, and search can filter by them.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/models/genre.py` | Model | `Genre` |
| `backend/app/repositories/genre.py` | Repository | `GenreRepository.get_by_name` |
| `backend/app/models/association_tables.py` | Join table | `archive_entry_genres` |
| `backend/app/services/metadata.py` | Only writer | `MetadataService._sync_genres` |
| `backend/app/repositories/archive_entry.py` | Only reader | `ArchiveEntryRepository.search` (`genre` arg) |
| `backend/app/api/search.py` | Filter exposure | `search_archive_entries` (`genre` query param) |
| `frontend/lib/api/archives.ts` | Sends the filter | `archiveApi.search` (`filters.genres[0]` sent as `genre`) |
| `frontend/lib/types/search.ts` | Types | `SearchFilters` (`genres`) |
| `frontend/app/search/page.tsx` | Genre input | `searchApi.search` |

## Graph IDs
| Type | ID |
|---|---|
| Model | `model:app.models.genre.Genre` |
| Repository | `repo:app.repositories.genre.GenreRepository` |
| Table | `table:genres`, `table:archive_entry_genres` |
| Service (writer) | `service:app.services.metadata.MetadataService` |
| Page | `page:/search` |
| TypeModule | `typemod:lib/types/search` |

## API Endpoints
None. Genres are only usable as the `genre` filter of `GET /api/search/` (exact name).

## Tables
`genres`, `archive_entry_genres`.

## Change guide
- Expose genres: create a genre schema module in `backend/app/schemas/`, a genres router module in `backend/app/api/` registered in `backend/app/api/__init__.py`, a computed genre field on `ArchiveEntryRead` (`backend/app/schemas/archive_entry.py`), then a frontend module under `frontend/lib/api/` and a type under `frontend/lib/types/`.
- Change how provider genres map to rows: `MetadataService._sync_genres` clears the entry's genres on every refresh and re-links them by name, creating missing `Genre` rows.

## Notes
- `ArchiveEntryRead` does not include genres, so the frontend never displays them (`frontend/app/archive/[id]/page.tsx` has a comment saying genres are omitted).
- The filter is an exact, case-sensitive name match: `ArchiveEntry.genres.any(Genre.name == genre)`.
