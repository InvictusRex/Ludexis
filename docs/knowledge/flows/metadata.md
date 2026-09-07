# Flow: Metadata Enrichment

## Overview
Automated metadata enrichment from external providers (IGDB, Steam, GOG) with conflict resolution.

## Search Flow
```
1. GET /metadata/search?q=game_title
   -> MetadataService.search(query)
     -> for each provider (sorted by priority):
       -> IGDBProvider.search(query) -> [MetadataSearchResult]
       -> SteamProvider.search(query) -> [MetadataSearchResult]
       -> GOGProvider.search(query) -> [] (stub)
     -> merge results, deduplicate by provider_id
   <- [MetadataSearchResult]

2. GET /metadata/details/{provider_name}/{provider_id}
   -> MetadataService.get_details(provider_name, provider_id)
     -> provider = get_provider(provider_name)
     -> provider.get_details(provider_id) -> MetadataDetails
   <- MetadataDetails {title, description, genres, developers, ...}
```

## Auto-Match Flow
```
MetadataService.auto_match_archive(entry)
  -> for each provider (priority order):
    -> provider.search(entry.title) -> results
    -> if results and results[0].score > threshold:
      -> return (provider_name, provider_id)
  -> return None (no match)
```

## Refresh Flow (Background)
```
1. scheduled_metadata_refresh_task (daily 03:00 UTC)
   -> creates JobHistory
   -> dispatches refresh_metadata_task

2. refresh_metadata_task(job_id, library_id):
   -> MetadataService.refresh_all(library_id)
     -> ArchiveEntryRepository.list_by_library(library_id)
     -> for each entry:
       -> MetadataService.refresh_archive(entry)
         -> auto_match(entry) -> (provider, provider_id)
         -> get_details(provider, provider_id)
         -> _ensure_genres(genres) -> GenreRepository
         -> _ensure_developers(developers) -> DeveloperRepository
         -> _ensure_publishers(publishers) -> PublisherRepository
         -> MetadataConflictResolver.resolve(existing, new_data)
         -> ArchiveEntryRepository.update(entry, merged_data)
       -> update progress
   -> JobService.update_status(job_id, "success")
```

## Conflict Resolution
```
MetadataConflictResolver.resolve(existing_metadata, new_metadata)
  -> if existing has metadata_override:
    -> preserve override fields
    -> merge non-overridden fields from new_metadata
  -> else:
    -> use new_metadata (provider data wins)
  -> return merged_metadata
```

## Entities Involved
- `service:app.services.metadata.MetadataService`
- `service:app.services.metadata_conflict.MetadataConflictResolver`
- `provider:app.providers.igdb.IGDBProvider`
- `provider:app.providers.steam.SteamProvider`
- `provider:app.providers.gog.GOGProvider`
- `provider:app.providers.manual.ManualProvider`
- `extprov:IGDB`, `extprov:Steam`, `extprov:GOG`
- `repo:app.repositories.genre.GenreRepository`
- `repo:app.repositories.developer.DeveloperRepository`
- `repo:app.repositories.publisher.PublisherRepository`
- `task:app.tasks.metadata_tasks.refresh_metadata_task`
- `task:app.tasks.metadata_tasks.scheduled_metadata_refresh_task`
