# Domain: Collection

## Overview
User-curated groupings of archive entries — collections allow organizing games into named sets with optional descriptions and cover art.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.collection.Collection` | Collection |
| Repository | `repo:app.repositories.collection.CollectionRepository` | CollectionRepository |
| Service | `service:app.services.collection.CollectionService` | CollectionService |
| Schema | `schema:app.schemas.collection.CollectionRead` | CollectionRead |

## Related Tables
- `collections` — collection definitions
- `collection_entries` — many-to-many with archive_entries

## API Endpoints
- `GET /collections/` — list collections
- `GET /collections/{id}` — get collection
- `POST /collections/` — create collection
- `PATCH /collections/{id}` — update collection
- `DELETE /collections/{id}` — delete collection
- `POST /collections/{id}/entries` — add entry to collection
- `DELETE /collections/{id}/entries/{entry_id}` — remove entry

## Notes
- Collections are soft-deleted
- Visibility: `public` or `private`
- Entry count computed from junction table
- Archive entries can belong to multiple collections
