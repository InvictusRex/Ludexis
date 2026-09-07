# Domain: Metadata

## Overview
External metadata enrichment — searches and retrieves game metadata from IGDB, Steam, GOG, and manual sources. Merges provider data and updates archive entries.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.metadata.MetadataService` | MetadataService |
| Service | `service:app.services.metadata_conflict.MetadataConflictResolver` | MetadataConflictResolver |
| Provider | `provider:app.providers.igdb.IGDBProvider` | IGDBProvider |
| Provider | `provider:app.providers.steam.SteamProvider` | SteamProvider |
| Provider | `provider:app.providers.gog.GOGProvider` | GOGProvider |
| Provider | `provider:app.providers.manual.ManualProvider` | ManualProvider |
| Task | `task:app.tasks.metadata_tasks.refresh_metadata_task` | refresh_metadata_task |
| Task | `task:app.tasks.metadata_tasks.scheduled_metadata_refresh_task` | scheduled_metadata_refresh_task |
| ExternalProvider | `extprov:IGDB` | IGDB |
| ExternalProvider | `extprov:Steam` | Steam |
| ExternalProvider | `extprov:GOG` | GOG |

## Related Tables
- `archive_entries` — metadata fields (metadata_status, metadata_source, etc.)
- `genres` — auto-created from provider data
- `developers` — auto-created from provider data
- `publishers` — auto-created from provider data
- `metadata_sources` — provider registry
- `job_history` — refresh job tracking

## Provider Priority
1. IGDB (priority=10) — most comprehensive
2. Steam (priority=20) — good artwork
3. GOG (priority=30) — stub, not implemented
4. Manual (priority=100) — fallback

## API Endpoints
- `GET /metadata/search` — search providers
- `GET /metadata/details/{provider}/{id}` — get full details
- `GET /metadata/artwork/{provider}/{id}` — download artwork

## Flow
```
API (/metadata/search) -> MetadataService.search(query)
  -> for each provider (sorted by priority):
    -> provider.search(query) -> list of results
  -> merge and deduplicate results

Scheduled (daily 03:00 UTC):
  scheduled_metadata_refresh_task
    -> creates JobHistory
    -> dispatches refresh_metadata_task
      -> MetadataService.refresh_all(library_id)
        -> for each archive_entry:
          -> MetadataService.refresh_archive(entry)
            -> auto_match(entry) -> provider.search(title)
            -> get_details(provider, provider_id)
            -> MetadataConflictResolver.resolve(existing, new)
            -> update archive_entry metadata fields
```

## Notes
- Metadata status states: `empty`, `matched`, `auto_enriched`, `manual_override`, `failed`
- Conflict resolution: manual overrides take precedence
- Provider rate limiting handled at client level
- Twitch OAuth2 for IGDB API access
