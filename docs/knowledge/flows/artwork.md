# Flow: Artwork upload, auto-download, validation and serving

Domain doc: `docs/knowledge/domains/artwork.md`.

## 1. Upload (cover / banner / logo / screenshot)
```
frontend/components/common/artwork-management-dialog.tsx  (opened from frontend/app/admin/artwork/page.tsx)
frontend/components/common/screenshot-gallery.tsx          (on frontend/app/archive/[id]/page.tsx)
frontend/app/admin/artwork/page.tsx                         (direct upload)
  -> artworkApi.upload({archive_entry_id, artwork_type, file, caption?})      frontend/lib/api/artwork.ts
     -> multipartRequest("/artwork/upload", FormData)    own fetch: Bearer header, no 401 refresh, throws Error
        POST /api/artwork/upload  (multipart form)                            EDIT_METADATA
        -> upload_artwork(archive_entry_id, artwork_type: ArtworkType, file: UploadFile, caption, ...)   backend/app/api/artwork.py
           -> ArtworkService.upload_artwork(db, archive_entry_id, artwork_type, file, caption=caption)   backend/app/services/artwork.py
              -> ArchiveEntryRepository.get_active(db, archive_entry_id)       ValueError -> 400
              -> ArtworkService._read_file(file)
                   non-empty ; is_allowed_artwork_mime_type(content_type, settings.ALLOWED_ARTWORK_MIME_TYPES) ;
                   len <= settings.MAX_ARTWORK_SIZE_MB * 1024 * 1024
              -> build_artwork_relative_path(entry_id, artwork_type, file.filename)   backend/app/utils/artwork.py
                   -> "{entry_id}/{artwork_type}/{uuid4().hex}{ext}"
              -> StorageService.save(relative_path, contents)    writes under settings.ARTWORK_STORAGE_PATH
              screenshot -> ScreenshotRepository.create(db, {archive_entry_id, file_path, caption})
              else       -> StorageService.delete(old <type>_path) ; setattr(entry, "<type>_path", path) ; commit
        <- 201 ArtworkUploadResponse {archive_entry_id, artwork_type, file_path, screenshot_id, caption}
```

## 2. Replace and delete
```
artworkApi.replace(...) -> multipartRequest("/artwork/replace", form, "PATCH")
  PATCH /api/artwork/replace -> replace_artwork -> ArtworkService.replace_artwork(db, entry_id, type, file, screenshot_id, caption)
     screenshot: requires screenshot_id ; ScreenshotRepository.get ; must belong to entry ;
                 StorageService.delete(old) ; StorageService.save(new) ; commit
     other:      ArchiveEntryRepository.get_active ; StorageService.delete(old) ; StorageService.save(new) ; commit
artworkApi.remove(artworkId, artworkType?) -> apiClient.delete("/artwork/{id}?artwork_type=...")
  DELETE /api/artwork/{artwork_id}?artwork_type= -> delete_artwork -> ArtworkService.delete_artwork(db, artwork_id, artwork_type)
     cover/banner/logo: artwork_id is the ENTRY id ; StorageService.delete ; column = None ; commit
     none/screenshot:   artwork_id is a SCREENSHOT id ; StorageService.delete ; ScreenshotRepository.delete
     not found -> ValueError -> 404
```

## 3. Missing artwork and auto-download (synchronous)
```
frontend/app/admin/artwork/page.tsx
  -> artworkApi.getMissing()   GET /api/artwork/missing   (authenticated)
     -> list_missing_artwork -> ArtworkService.list_missing_artwork(db)
        ArchiveEntryRepository.list_active ; missing = no cover_path / banner_path / logo_path / screenshots
     <- list[ArtworkMissingResponse]
  -> artworkApi.autoDownload() POST /api/artwork/auto-download   (EDIT_METADATA, runs in the request)
     -> auto_download_missing_artwork -> ArtworkService.auto_download_missing_artwork(db)
        artwork_auto_download_runs_total.inc()
        for entry in ArchiveEntryRepository.list_active(db):
           no cover_path  -> ArtworkService.auto_download_cover(db, entry.id)
           no banner_path -> ArtworkService.auto_download_banner(db, entry.id)
           no logo_path   -> ArtworkService.auto_download_logo(db, entry.id)
           no screenshots -> ArtworkService.auto_download_screenshots(db, entry.id)
           (exceptions counted as failed, artwork_validation_failures_total.inc())
        each auto_download_<type>:
           -> MetadataService.get_merged_details(entry.title)           provider lookup (see metadata flow)
           -> ArtworkService._select_best_url(details.<type>_urls)
                _score_artwork_candidate(url) + _download_artwork_url(url) + _score_image(bytes)
           -> ArtworkService._download_artwork_url(best)   requests.get(timeout=30), MIME + size checks
           -> StorageService.save("covers|banners|logos/{entry_id}{ext}", bytes) ; set column ; commit
        screenshots: ArtworkService._download_screenshots -> deletes existing screenshots,
                     saves "screenshots/{entry_id}_{n}{ext}", INSERT screenshots
     <- {"downloaded": n, "failed": m}
```

## 4. Validation (scheduled or job)
```
celery beat 04:00 UTC -> scheduled_artwork_validation_task()      backend/app/tasks/artwork_tasks.py
  -> INSERT JobHistory(ARTWORK_REFRESH, PENDING) ; validate_artwork_task.delay(job.id)
POST /api/jobs/start {"job_type": "ARTWORK_REFRESH"} -> JobService._select_task -> validate_artwork_task
validate_artwork_task(job_history_id)
  -> status RUNNING
  -> ArtworkService.validate_all_artwork(db)
     for entry in ArchiveEntryRepository.list_active(db):
        cover/banner/logo: missing if no path or not StorageService.exists ; corrupt if PIL Image.verify() fails
        entry.verification_status = MISSING if any missing/corrupt else VERIFIED
     commit
  -> status SUCCESS, result "Artwork validation completed: N entries checked"
```
Not wired to any route or task: `ArtworkService.validate_and_redownload_artwork`, `deduplicate_artwork` (SHA-256 via `_file_sha256`, canonical `dedup/{type}/{hash}.jpg`), `garbage_collect_artwork`.

## 5. Serving files
```
<img src={mediaUrl(entry.cover_path)}>                            frontend/lib/media.ts
  -> "{config.mediaBaseUrl}/{path}"   (default http://localhost:8000/media)
  GET /media/{path:path}                                          backend/main.py
  -> read_media(path, current_user=Depends(get_current_active_user))
     resolve under media_dir (= StorageService().base_dir) ; 404 if outside or not a file
  <- FileResponse
```
`<img>` requests carry no `Authorization` header, while `read_media` requires one.

## 6. Listing screenshots
```
ScreenshotGallery -> archiveApi.getScreenshots(entryId)
  GET /api/archive-entries/{archive_entry_id}/screenshots -> list_screenshots
    -> ArchiveEntryService.get (404 if missing) -> ScreenshotRepository.list_by_entry(db, id)
  <- list[ScreenshotRead]
```

## Entities
`router:app.api.artwork`, `service:app.services.artwork.ArtworkService`, `service:app.services.storage.StorageService`, `service:app.services.metadata.MetadataService`, `repo:app.repositories.screenshot.ScreenshotRepository`, `repo:app.repositories.archive_entry.ArchiveEntryRepository`, `module:app.utils.artwork`, `task:app.tasks.artwork_tasks.validate_artwork_task`, `task:app.tasks.artwork_tasks.scheduled_artwork_validation_task`, `table:archive_entries`, `table:screenshots`, `router:main`, `page:/admin/artwork`, `page:/archive/[id]`, `comp:components/common/artwork-management-dialog`, `comp:components/common/screenshot-gallery`, `apimod:lib/api/artwork`, `lib:lib/media`.
