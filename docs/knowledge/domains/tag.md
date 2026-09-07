# Domain: Tag

## Overview
Tagging system — allows users to assign freeform tags to archive entries for categorization and filtering.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.tag.Tag` | Tag |
| Repository | `repo:app.repositories.tag.TagRepository` | TagRepository |
| Service | `service:app.services.tag.TagService` | TagService |
| Schema | `schema:app.schemas.tag.TagRead` | TagRead |

## Related Tables
- `tags` — tag definitions
- `archive_entry_tags` — many-to-many with archive_entries

## API Endpoints
- `GET /tags/` — list tags
- `GET /tags/{id}` — get tag
- `POST /tags/` — create tag
- `PATCH /tags/{id}` — update tag
- `DELETE /tags/{id}` — delete tag

## Notes
- Tags have optional `color` field (hex code)
- Entry count computed via association table
- Tags are NOT soft-deleted (hard delete)
- Used in search filtering via trigram similarity
