# Domain: Archive

## Overview
Core domain managing game archive entries — the central entity of the Ludexis platform. Handles CRUD operations, metadata association, duplicate detection, and archive lifecycle management.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.archive_entry.ArchiveEntry` | ArchiveEntry |
| Repository | `repo:app.repositories.archive_entry.ArchiveEntryRepository` | ArchiveEntryRepository |
| Service | `service:app.services.archive_entry.ArchiveEntryService` | ArchiveEntryService |
| Schema | `schema:app.schemas.archive_entry.ArchiveEntryRead` | ArchiveEntryRead |

## Related Tables
- `archive_entries` — primary table
- `archive_entry_tags` — many-to-many with tags
- `archive_entry_developers` — many-to-many with developers
- `archive_entry_publishers` — many-to-many with publishers
- `collection_entries` — many-to-many with collections

## Dependencies
- **Depends on**: TagRepository, DeveloperRepository, PublisherRepository, CollectionRepository, FranchiseRepository
- **Depended by**: ScannerService, ArtworkService, SearchService, MatchingService, MetadataService

## API Endpoints
- `GET /archive-entries/` — list entries
- `GET /archive-entries/{id}` — get entry
- `POST /archive-entries/` — create entry
- `PATCH /archive-entries/{id}` — update entry
- `DELETE /archive-entries/{id}` — soft delete
- `PATCH /archive-entries/{id}/metadata` — override metadata
- `GET /archive-entries/duplicates` — list duplicates by hash
- `GET /archive-entries/{id}/screenshots` — list screenshots

## Domain Entities
| Entity | Layer |
|--------|-------|
| `domain:archive` | Service: ArchiveEntryService, ScannerService, MatchingService |
| `domain:archive` | Repository: ArchiveEntryRepository |
| `domain:archive` | Model: ArchiveEntry |
