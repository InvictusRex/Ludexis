# Backlog

## Authentication & Authorization

### High Priority

- Fix Swagger OAuth2 integration mismatch (Swagger expects OAuth2 Password Flow form data while backend login endpoint currently accepts JSON payloads).
- Replace development JWT secret with a generated production-grade secret.
- Replace all development credentials and example secrets before public releases.
- Review and stabilize bcrypt/passlib dependency versions to prevent compatibility regressions.
- Add automated integration tests for authentication, token refresh, logout, and authorization flows.

### Medium Priority

- Improve Swagger authorization experience for protected endpoints.
- Add token expiration and refresh workflow tests.

---

## Security & RBAC

### High Priority

- Seed default permissions during system initialization.
- Seed default roles during system initialization.
- Seed default role-permission mappings during system initialization.
- Create administrator role automatically during first-time setup.
- Validate permission enforcement across all protected endpoints.

### Medium Priority

- Add role management UI support.
- Add permission audit reporting.
- Expand audit logging coverage for administrative actions.

---

## Metadata & Enrichment

### High Priority

- Implement IGDB provider integration.
- Implement Steam metadata provider.
- Implement GOG metadata provider.
- Implement automatic metadata matching workflow.
- Implement metadata refresh jobs.

### Medium Priority

- Metadata confidence scoring.
- Metadata conflict resolution.
- Multi-provider metadata merging.
- Manual metadata override workflow.

---

## Artwork System

### High Priority

- Implement artwork download pipeline.
- Implement artwork validation jobs.
- Implement local artwork caching and storage management.

### Medium Priority

- Automatic cover selection.
- Screenshot importing.
- Artwork quality scoring.
- Artwork deduplication.

---

## Archive Management

### High Priority

- Fix `ArchiveEntryRead` serialization inconsistencies.
  - Relationship data is returned correctly.
  - `tag_ids`
  - `developer_ids`
  - `publisher_ids`
  - `collection_ids`
    currently return empty arrays despite valid relationships existing.

### Medium Priority

- Improve filename normalization.
- Improve version detection from filenames.
- Improve archive naming heuristics.
- Duplicate archive detection.
- Multi-library support.

---

## Scanner & Ingestion

### Planned

- Archive hash generation.
- Incremental scan optimization.
- Parallel scan execution.
- Archive integrity verification.
- File move/rename detection.

---

## Background Jobs

### Planned

- Job retry policies.
- Scheduled metadata refreshes.
- Scheduled artwork validation.
- Job queue monitoring endpoints.
- Job cancellation improvements.

---

## API & Documentation

### High Priority

- Fix Swagger OAuth2 flow compatibility.

### Medium Priority

- Improve OpenAPI examples.
- Expand endpoint documentation.
- Add API usage guides.
- Add developer integration examples.

---

## Infrastructure

### Medium Priority

- Move all runtime configuration fully into environment variables.
- Remove remaining hardcoded development defaults.
- Review Docker production deployment configuration.
- Add CI/CD validation pipeline.

### Low Priority

- Health check endpoints.
- Metrics and monitoring integration.
- Structured logging improvements.

---

## Testing

### High Priority

- Authentication integration tests.
- RBAC integration tests.
- Scanner integration tests.
- Metadata provider tests.
- Background job tests.

### Medium Priority

- End-to-end API test suite.
- Performance testing for large libraries.
- Load testing for search and scan operations.

---

# Verified Working Components

The following systems have been manually validated and are not considered backlog items:

- FastAPI application startup
- PostgreSQL integration
- Alembic migrations
- JWT authentication
- Initial setup workflow
- User creation
- CRUD APIs
- Search system
- Redis integration
- Celery worker execution
- Background job dispatching
- Full library scan jobs
- Automatic archive discovery
- Archive entry creation
- Collection relationships
- Developer relationships
- Publisher relationships
- Tag relationships
- Library ingestion pipeline
