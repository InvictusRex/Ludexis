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
           (VNDBProvider 5, IGDBProvider 10, SteamProvider 20, ManualProvider 100)
        -> for provider: provider.search(query, limit=20)
              IGDBProvider.search -> IGDBClient.post(...) (Twitch OAuth token via IGDBClient._ensure_token)
              SteamProvider.search -> requests.get(Steam store search)
              VNDBProvider.search -> requests.post(Kana API)
              ManualProvider -> []
           first provider with results wins (break); exceptions logged and skipped
           (interactive search only; automatic matching uses MetadataService.auto_match, see 3)
  <- list[MetadataSearchResult]
  with provider=<name>|all (Identify dialog): MetadataService.search_providers(db, q, provider)
     one named provider, or every provider in the provider_order setting; all results, each with cover_url
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

## 2b. Identify (manual match)
```
frontend/components/common/identify-dialog.tsx (detail page, metadata review page)
  -> metadataApi.searchProvider(query, provider)          GET /api/metadata/search?q=...&provider=...
  -> archiveApi.identify(id, provider, providerId)
  POST /api/archive-entries/{archive_entry_id}/identify     EDIT_METADATA
  -> identify_archive_entry(...)                            backend/app/api/archive_entries.py
     -> MetadataService.identify(db, entry, provider, provider_id)
        details = get_merged_details(entry.title, provider, provider_id, db)    404 if None
        entry.metadata_override = False
        targets = entry + GroupingService.siblings(entry) without metadata_override
        each: title = details.title ; source/code ; MATCHED ; confidence 1.0 ; refresh_archive(db, target, details)
     -> JobService.start_job(ARTWORK_REFRESH, task_kwargs={"mode": "replace", "entry_ids": targets})
        validate_artwork_task(mode="replace") -> ArtworkService.replace_entries_artwork
           fill_missing_artwork(entry, repair=cover, banner, logo, screenshots)
     -> AuditService.record(IDENTIFY_ARCHIVE)
  <- {entry, updated_entries, artwork_job}
```

## 3. Enrichment job (after scans, nightly, or manual)
```
Queued by:
  scan tasks          -> _queue_enrichment -> JobService.start_job(..., METADATA_REFRESH, task_kwargs={"entry_ids": created_ids})
  scheduler tick (metadata_refresh, 03:00) -> JobService.active_job(db, METADATA_REFRESH) ? retry next tick
                         : JobService.start_job(db, None, METADATA_REFRESH, details="Scheduled metadata refresh")
  POST /api/jobs/start {"job_type": "METADATA_REFRESH"}
refresh_metadata_task(self, job_history_id, entry_ids=None)          backend/app/tasks/metadata_tasks.py
  -> run_job(...) -> EnrichmentService().enrich(db, entry_ids, job_id, report)   backend/app/services/enrichment.py
     entries = MetadataService.enrichment_candidates(db, entry_ids)
        not deleted, metadata_override False;
        entry_ids given -> exactly those; otherwise metadata_source_code IS NOT NULL OR last_metadata_refresh IS NULL
     for entry: job CANCELED -> stats["cancelled"] ; return
        try MetadataService.enrich_archive(db, entry)
               has metadata_source + metadata_source_code -> refresh_archive(db, entry)
               else                                       -> auto_match_archive(db, entry)
            matched/partial -> ArtworkService.fill_missing_artwork(db, entry)   (see artwork flow)
        except -> db.rollback() ; stats["errors"] += 1 ; continue
        report(index, len(entries))
     <- {processed, matched, unmatched, artwork_downloaded, errors, cancelled}
```

## 4. Matching and refresh (`backend/app/services/metadata.py`)
```
MetadataService.auto_match(title)
  for provider in _match_providers(db):             provider_order setting (default VNDB, IGDB, Steam)
     for result in _search_provider(provider, title, limit=20): score = title_similarity(title, result.title)
     best_score >= MATCHED_THRESHOLD (0.85) -> stop
  <- (best result across providers, best score)
title_similarity(a, b): 1.0 if alphanumeric-only lowercase strings are equal,
                        else mean(SequenceMatcher ratio, word Jaccard)
MetadataService.auto_match_archive(db, archive)
  skip metadata_override
  last_metadata_refresh = now ; metadata_confidence = round(score, 3)
  score < PARTIAL_THRESHOLD (0.70) -> UNMATCHED, no metadata_source recorded ; commit ; False
  else MATCHED (>= 0.85) | PARTIAL ; metadata_source/metadata_source_code = match ; commit ; refresh_archive
MetadataService.refresh_archive(db, archive, details=None)
  skip metadata_override or missing metadata_source/metadata_source_code
  details = details or get_merged_details(archive.title, archive.metadata_source, archive.metadata_source_code, db)
     primary = get_details(stored provider, stored id)
     for every other provider in provider_order: _find_same_game(provider, primary, title)
        first search hit (primary title, then entry title) scoring >= 0.85 ; get_details ;
        dropped when both release years are known and differ by more than one
        -> merged = MetadataConflictResolver.resolve(merged, supplement)
  _sync_genres ; _sync_companies for developers/publishers (repo.get_by_name matches name_key = company_key(name),
     so spellings of one company link one record) ; _sync_tags ; _sync_franchise
  description, release_date, last_metadata_refresh ; commit
```

## 5. Provider data used by artwork
`ArtworkService._entry_details(entry)` calls `MetadataService.get_merged_details(entry.title, entry.metadata_source, entry.metadata_source_code)`; the `auto_download_*` methods accept these `details` so enrichment fetches them once per entry. Steam supplies `cover_urls` (`library_600x900.jpg`), `banner_urls` (header), `logo_urls` (capsules) and `artwork_urls` (store screenshots). See `docs/knowledge/flows/artwork.md`.

## 6. History widgets (frontend)
`MetadataHistoryCard` and `MetadataAuditTrail` on `frontend/app/archive/[id]/page.tsx` call `adminApi.getAuditLogs({entity: "ArchiveEntry"})` -> `GET /api/admin/audit-logs` (`VIEW_AUDIT_LOGS`) and filter by `entity_id` client side.

## Entities
`router:app.api.metadata`, `module:app.core.dependencies`, `service:app.services.metadata.MetadataService`, `service:app.services.metadata_conflict.MetadataConflictResolver`, `provider:app.providers.igdb.IGDBProvider`, `provider:app.providers.igdb_client.IGDBClient`, `provider:app.providers.steam.SteamProvider`, `provider:app.providers.manual.ManualProvider`, `comp:components/common/identify-dialog`, `api:POST:/archive-entries/{archive_entry_id}/identify`, `service:app.services.enrichment.EnrichmentService`, `service:app.services.artwork.ArtworkService`, `task:app.tasks.metadata_tasks.refresh_metadata_task`, `provider:app.providers.vndb.VNDBProvider`, `service:app.services.settings.SettingsService`, `repo:app.repositories.genre.GenreRepository`, `repo:app.repositories.developer.DeveloperRepository`, `repo:app.repositories.publisher.PublisherRepository`, `table:archive_entries`, `table:genres`, `table:archive_entry_genres`, `table:archive_entry_developers`, `table:archive_entry_publishers`, `page:/admin/metadata`, `apimod:lib/api/metadata`.
