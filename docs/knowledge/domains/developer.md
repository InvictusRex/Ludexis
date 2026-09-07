# Domain: Developer

## Overview
Developer management — tracks game development studios and their associated archive entries.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.developer.Developer` | Developer |
| Repository | `repo:app.repositories.developer.DeveloperRepository` | DeveloperRepository |
| Service | `service:app.services.developer.DeveloperService` | DeveloperService |
| Schema | `schema:app.schemas.developer.DeveloperRead` | DeveloperRead |

## Related Tables
- `developers` — developer definitions
- `archive_entry_developers` — many-to-many with archive_entries

## API Endpoints
- `GET /developers/` — list developers
- `GET /developers/{id}` — get developer
- `POST /developers/` — create developer
- `PATCH /developers/{id}` — update developer
- `DELETE /developers/{id}` — delete developer

## Notes
- Entry count computed via association table
- Developers are NOT soft-deleted (hard delete)
- Auto-created by MetadataService during enrichment
- Used in search filtering
