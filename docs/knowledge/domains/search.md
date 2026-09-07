# Domain: Search

## Overview
Full-text search — provides archive entry search with trigram similarity, tag/developer/publisher/franchise filtering.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.search.SearchService` | SearchService |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository` | ArchiveEntryRepository |

## Related Tables
- `archive_entries` — trigram indexes on title, description
- `archive_entry_tags` — tag filter joins
- `archive_entry_developers` — developer filter joins
- `archive_entry_publishers` — publisher filter joins

## API Endpoints
- `GET /search/?q=...&tag_ids=...&developer_ids=...` — search entries

## Search Features
- Trigram similarity on title and description
- Filter by tag IDs, developer IDs, publisher IDs, franchise ID
- Filter by archive type
- Results ordered by relevance score

## Notes
- Uses PostgreSQL `pg_trgm` extension for fuzzy matching
- Search index: `ix_archive_entries_title_trgm`, `ix_archive_entries_description_trgm`
- ArchiveEntryRepository.search() performs complex UNION across multiple tables
