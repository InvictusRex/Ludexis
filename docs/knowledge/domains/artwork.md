# Domain: Artwork

## Overview
Artwork management — handles cover, banner, logo, and screenshot acquisition, upload, replacement, validation, and deduplication.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.artwork.ArtworkService` | ArtworkService |
| Service | `service:app.services.storage.StorageService` | StorageService |
| Repository | `repo:app.repositories.screenshot.ScreenshotRepository` | ScreenshotRepository |
| Model | `model:app.models.screenshot.Screenshot` | Screenshot |
| Task | `task:app.tasks.artwork_tasks.validate_artwork_task` | validate_artwork_task |
| Task | `task:app.tasks.artwork_tasks.scheduled_artwork_validation_task` | scheduled_artwork_validation_task |

## Related Tables
- `archive_entries` — cover_path, banner_path, logo_path columns
- `screenshots` — screenshot file references

## Artwork Types
| Type | Column/Field | Storage |
|------|-------------|---------|
| Cover | `cover_path` | `{library}/.ludexis/artwork/{entry_id}/cover.{ext}` |
| Banner | `banner_path` | `{library}/.ludexis/artwork/{entry_id}/banner.{ext}` |
| Logo | `logo_path` | `{library}/.ludexis/artwork/{entry_id}/logo.{ext}` |
| Screenshot | `screenshots.file_path` | `{library}/.ludexis/artwork/{entry_id}/screenshots/{n}.{ext}` |

## API Endpoints
- `POST /artwork/upload` — upload artwork
- `PATCH /artwork/replace` — replace artwork
- `DELETE /artwork/{id}` — delete artwork
- `GET /artwork/missing` — list entries with missing artwork
- `POST /artwork/auto-download` — auto-download from providers

## Flow
```
Auto-download:
  ArtworkService.auto_download_missing_artwork(library_id)
    -> list_missing_artwork() -> entries without covers/banners
    -> for each entry:
      -> MetadataService.get_merged_details(entry) -> provider URLs
      -> auto_download_cover/ banner/ logo/ screenshots(entry, urls)
        -> StorageService.save(file, path)

Validation (daily 04:00 UTC):
  scheduled_artwork_validation_task
    -> dispatches validate_artwork_task
      -> ArtworkService.validate_all_artwork()
        -> for each entry:
          -> check cover_path/banner_path/logo_path exist on disk
          -> validate screenshot files
          -> update verification_status
```

## Notes
- Artwork stored on persistent Docker volumes
- File type validation: jpg, png, webp
- Max file size: 10MB for uploads
- Deduplication via perceptual hashing
- Garbage collection removes orphaned files
