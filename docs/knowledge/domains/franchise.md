# Domain: Franchise

## Overview
Franchise management — organizes game series/hierarchies with parent-child relationships.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.franchise.Franchise` | Franchise |
| Repository | `repo:app.repositories.franchise.FranchiseRepository` | FranchiseRepository |
| Service | `service:app.services.franchise.FranchiseService` | FranchiseService |
| Schema | `schema:app.schemas.franchise.FranchiseRead` | FranchiseRead |

## Related Tables
- `franchises` — franchise definitions (self-referential FK: `parent_id`)

## API Endpoints
- `GET /franchises/` — list franchises
- `GET /franchises/{id}` — get franchise
- `POST /franchises/` — create franchise
- `PATCH /franchises/{id}` — update franchise
- `DELETE /franchises/{id}` — delete franchise

## Notes
- Self-referential hierarchy: `parent_id -> franchises.id`
- Entry count computed via FK on `archive_entries.franchise_id`
- Franchises are NOT soft-deleted (hard delete)
- Supports nested franchise structures (e.g., "Final Fantasy" -> "Final Fantasy VII")
