# Flow: Metadata lookup, refresh and manual override

Domain doc: `docs/knowledge/domains/metadata.md`.

## 1. Interactive provider search
```
frontend/app/admin/metadata/page.tsx            -> metadataApi.search(query, providerPriority?)
frontend/components/common/metadata-comparison.tsx -> metadataApi.search(...)        frontend/lib/api/metadata.ts
  GET /api/metadata/search?q=...&provider_priority=...        authenticated
  -> search_metadata(q, provider_priority, current_user, metadata_service=Depends(get_metadata_service))
                                                               backend/app/api/metadata.py, backend/app/core/dependencies.py
     -> MetadataService.search(q, preferred_providers=provider_priority)   backend/app/services/metadata.py
        metadata_searches_total.inc()
        -> MetadataService._get_providers(preferred) : preferred names first, then by priority
           (IGDBProvider 10, SteamProvider 20, GOGProvider 30, ManualProvider 100)
        -> for provider: provider.search(query, limit=20)
              IGDBProvider.search -> IGDBClient.post(...) (Twitch OAuth token via IGDBClient._ensure_token)
              SteamProvider.search -> requests.get(Steam store search)
              GOGProvider / ManualProvider -> []
           first provider with results wins (break); exceptions logged and skipped
  <- list[MetadataSearchResult]
GET /api/metadata/details/{provider_name}/{provider_id} -> read_metadata_details -> MetadataService.get_details  (404 if None)
GET /api/metadata/artwork/{provider_name}/{provider_id} -> read_metadata_artwork -> MetadataService.download_artwork
     (every provider returns None -> always 404)
```

## 2. Manual override (admin)
```
frontend/app/admin/metadata/page.tsx -> archiveApi.updateMetadata(id, ArchiveMetadataUpdate)   frontend/lib/api/archives.ts
  PATCH /api/archive-entries/{archive_entry_id}/metadata        EDIT_METADATA
  -> override_archive_metadata(archive_entry_id, data, ...)     backend/app/api/archive_entries.py
     -> ArchiveEntryService.get(db, id) -> ArchiveEntryRepository.get_active   404 if None
     -> ArchiveEntryService.update_metadata(db, entry, data)
        title/description/release_date if provided ; metadata_override = data.metadata_override ;
        metadata_status = MANUAL ; commit
     -> AuditService.record(db, current_user, action="MANUAL_METADATA_OVERRIDE", entity="ArchiveEntry", ...)
  <- ArchiveEntryRead
```

## 3. Scheduled refresh (the only path that runs real refresh)
```
celery beat 03:00 UTC -> scheduled_metadata_refresh_task()      backend/app/tasks/metadata_tasks.py
  -> skip if a METADATA_REFRESH job is PENDING/RUNNING
  -> INSERT JobHistory(METADATA_REFRESH, PENDING) ; refresh_metadata_task.delay(job.id)
refresh_metadata_task(job_history_id)
  -> JobHistoryRepository.get ; status RUNNING ; commit
  -> MetadataService.refresh_all(db, job.id)
     archives = ArchiveEntry rows with metadata_status == MATCHED
     for archive:
        JobHistory.status == CANCELED -> return {"refreshed", "failed", "cancelled": True}
        skip metadata_override
        MetadataService.refresh_archive(db, archive)
          skip if metadata_override or no metadata_source / metadata_source_code -> False
          details = MetadataService.get_merged_details(archive.title)
             -> MetadataService.auto_match(title)
                  -> MetadataService.search(title, preferred_providers=["IGDB"], limit=20)
                  -> best SequenceMatcher ratio over result titles
             -> MetadataService.get_details(match.provider, match.provider_id)
             -> SteamProvider().search(title, limit=1) -> SteamProvider().get_details(...)
             -> MetadataConflictResolver.resolve(igdb_details, steam_details)
          MetadataService._sync_genres(db, archive, details.genres)
          MetadataService._sync_developers(db, archive, details.developers)
          MetadataService._sync_publishers(db, archive, details.publishers)
             (each clears the relation, then get_by_name or creates Genre/Developer/Publisher)
          description, release_date, last_metadata_refresh ; commit
  -> status SUCCESS / CANCELED ; result "Metadata refresh completed: {stats}"
```
`POST /api/jobs/start {"job_type": "METADATA_REFRESH"}` (admin dashboard button) dispatches the same `refresh_metadata_task` through `JobService._select_task`.

## 4. Auto-match (not wired)
`MetadataService.auto_match_archive(db, archive)` sets `metadata_status` (>= 0.85 MATCHED, >= 0.70 PARTIAL, else UNMATCHED), `metadata_source`, `metadata_source_code`, `metadata_confidence`, description and release date. It is only called from `backend/tests/test_screenshots_api.py`; neither the scanner nor any task or route calls it.

## 5. Provider data used by artwork
`ArtworkService.auto_download_cover/banner/logo/screenshots` call `MetadataService.get_merged_details(entry.title)` and use `cover_urls`, `banner_urls`, `logo_urls`, `artwork_urls` (see `docs/knowledge/flows/artwork.md`).

## 6. History widgets (frontend)
`MetadataHistoryCard` and `MetadataAuditTrail` on `frontend/app/archive/[id]/page.tsx` call `adminApi.getAuditLogs({entity: "ArchiveEntry"})` -> `GET /api/admin/audit-logs` (`VIEW_AUDIT_LOGS`) and filter by `entity_id` client side.

## Entities
`router:app.api.metadata`, `module:app.core.dependencies`, `service:app.services.metadata.MetadataService`, `service:app.services.metadata_conflict.MetadataConflictResolver`, `provider:app.providers.igdb.IGDBProvider`, `provider:app.providers.igdb_client.IGDBClient`, `provider:app.providers.steam.SteamProvider`, `provider:app.providers.gog.GOGProvider`, `provider:app.providers.manual.ManualProvider`, `task:app.tasks.metadata_tasks.refresh_metadata_task`, `task:app.tasks.metadata_tasks.scheduled_metadata_refresh_task`, `repo:app.repositories.genre.GenreRepository`, `repo:app.repositories.developer.DeveloperRepository`, `repo:app.repositories.publisher.PublisherRepository`, `table:archive_entries`, `table:genres`, `table:archive_entry_genres`, `table:archive_entry_developers`, `table:archive_entry_publishers`, `page:/admin/metadata`, `apimod:lib/api/metadata`.
