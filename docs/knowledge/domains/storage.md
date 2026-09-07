# Domain: Storage

## Overview
File storage — handles artwork file persistence on the filesystem.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.storage.StorageService` | StorageService |

## API Endpoints
None (internal service only).

## Methods
- `save(file, path)` — save file to disk
- `delete(path)` — remove file
- `exists(path)` — check file existence
- `absolute_path(path)` — resolve to absolute path

## Notes
- Stores artwork files under `{library}/.ludexis/artwork/{entry_id}/`
- No database interaction — purely filesystem operations
- Used by ArtworkService for all file I/O
- File type validation happens at the service layer (ArtworkService)
