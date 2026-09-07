# Domain: Library

## Overview
Library configuration — defines filesystem root directories that the scanner monitors for game archives.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.library.Library` | Library |
| Repository | `repo:app.repositories.library.LibraryRepository` | LibraryRepository |
| Service | `service:app.services.library.LibraryService` | LibraryService |
| Schema | `schema:app.schemas.library.LibraryRead` | LibraryRead |

## Related Tables
- `libraries` — library configurations
- `archive_entries` — FK to libraries

## API Endpoints
- `GET /libraries/` — list libraries
- `GET /libraries/{id}` — get library
- `POST /libraries/` — create library (requires ACCESS_ADMIN)
- `PATCH /libraries/{id}` — update library
- `DELETE /libraries/{id}` — delete library

## Notes
- Libraries are soft-deleted
- Each library has a unique `path` constraint
- `enabled` flag controls whether scanner processes the library
- Library path must be an absolute filesystem path
- ScannerService reads library paths during scan operations
