# Domain: Publisher

## Overview
Publisher management — tracks game publishers and their associated archive entries.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.publisher.Publisher` | Publisher |
| Repository | `repo:app.repositories.publisher.PublisherRepository` | PublisherRepository |
| Service | `service:app.services.publisher.PublisherService` | PublisherService |
| Schema | `schema:app.schemas.publisher.PublisherRead` | PublisherRead |

## Related Tables
- `publishers` — publisher definitions
- `archive_entry_publishers` — many-to-many with archive_entries

## API Endpoints
- `GET /publishers/` — list publishers
- `GET /publishers/{id}` — get publisher
- `POST /publishers/` — create publisher
- `PATCH /publishers/{id}` — update publisher
- `DELETE /publishers/{id}` — delete publisher

## Notes
- Entry count computed via association table
- Publishers are NOT soft-deleted (hard delete)
- Auto-created by MetadataService during enrichment
- Used in search filtering
