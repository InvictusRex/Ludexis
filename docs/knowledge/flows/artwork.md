# Flow: Artwork Acquisition

## Overview
Artwork download, upload, validation, and lifecycle management.

## Auto-Download Flow
```
1. POST /artwork/auto-download
   -> ArtworkService.auto_download_missing_artwork(library_id)
     -> ArchiveEntryRepository.list_by_library(library_id)
     -> for each entry missing artwork:
       -> MetadataService.get_merged_details(entry)
         -> provider.get_details(provider_id) -> URLs
       -> if cover missing and cover_url:
         -> download cover from URL
         -> StorageService.save(file, cover_path)
         -> ArchiveEntryRepository.update(entry, {cover_path})
       -> if banner missing and banner_url:
         -> similar...
       -> if logo missing and logo_url:
         -> similar...
       -> if screenshots missing:
         -> download screenshots
         -> ScreenshotRepository.create({entry_id, file_path, ...})
```

## Upload Flow
```
POST /artwork/upload
  -> ArtworkService.upload_artwork(entry_id, artwork_type, file)
    -> validate file type (jpg, png, webp)
    -> validate file size (<= 10MB)
    -> determine storage path
    -> StorageService.save(file, path)
    -> ArchiveEntryRepository.update(entry, {cover_path: path})
    -> AuditService.record("artwork.upload", ...)
  <- ArtworkUploadResponse {archive_entry_id, artwork_type, file_path}
```

## Validation Flow (Background)
```
1. scheduled_artwork_validation_task (daily 04:00 UTC)
   -> creates JobHistory
   -> dispatches validate_artwork_task

2. validate_artwork_task(job_id):
   -> ArtworkService.validate_all_artwork()
     -> ArchiveEntryRepository.list_all()
     -> for each entry:
       -> check cover_path exists on disk (StorageService.exists)
       -> check banner_path exists
       -> check logo_path exists
       -> check screenshots exist
       -> update verification_status
     -> ArtworkService.garbage_collect_artwork()
       -> find orphaned files (not referenced by any entry)
       -> StorageService.delete(orphaned_file)
   -> JobService.update_status(job_id, "success")
```

## Entities Involved
- `service:app.services.artwork.ArtworkService`
- `service:app.services.storage.StorageService`
- `service:app.services.metadata.MetadataService`
- `repo:app.repositories.archive_entry.ArchiveEntryRepository`
- `repo:app.repositories.screenshot.ScreenshotRepository`
- `model:app.models.screenshot.Screenshot`
- `task:app.tasks.artwork_tasks.validate_artwork_task`
- `task:app.tasks.artwork_tasks.scheduled_artwork_validation_task`
