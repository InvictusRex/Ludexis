# Ludexis Release Notes

## v1.0.0 (2026-08-04)

Initial feature-complete release of Ludexis, a self-hosted game archive
management platform.

### Archive & Library

- Library management with configurable scan paths and incremental scans
- Archive entry catalog with cover, banner, and logo artwork
- Duplicate detection and resolution workflows
- Archive screenshots gallery (upload + metadata-driven)
- Bulk actions on the library (select, tag, move, delete)

### Metadata & Enrichment

- Automatic metadata matching against provider APIs (Steam, IGDB, GOG)
- Manual metadata editing with provider source badges
- Metadata confidence scoring and conflicts panel
- Metadata history and full audit trail
- Artwork quality indicators, comparison dialog, and version history

### Collections, Tags & Taxonomies

- Collections with custom covers and recommended entries
- Tag, developer, publisher, genre, and franchise management
- Relationship visualization between entries and franchises
- Advanced search with saved searches and saved search workflows

### Administration

- User management with role-based access control
- Effective permissions panel and permission matrix
- Audit log viewer with activity filtering
- Job history, reports, and background task analytics
- Live operational dashboard with trend visualization
- User analytics dashboard (login frequency, permissions, activity)
- Monitoring page with Prometheus metrics and Grafana integration
- Artwork administration (upload, replacement, deletion)
- Settings and metadata policy configuration

### Platform & UX

- JWT authentication with refresh tokens and auto-logout on expiry
- Role-aware navigation and protected routes
- Pagination across list views
- Responsive layout with mobile navigation
- Skip-to-content links and screen-reader labelling
- Motion-safe animations and micro-interactions
- Real-time background task polling

### Deployment

- Docker Compose stack (PostgreSQL, Redis, backend, worker, monitoring)
- Standalone Next.js frontend image
- One-command demo stack pre-seeded with a demo dataset
- `/media` static serving for artwork assets
- Deployment guide, architecture docs, and API guide

### Quality

- Backend: automated API test suite (140 tests)
- Frontend: unit/integration suite (210 tests across 37 files)
- Playwright end-to-end tests across Chromium, Firefox, and WebKit
- Visual regression screenshots
- TypeScript strict typecheck and lint clean

### Demo Credentials

The demo stack seeds an administrator account:

| Username | Password |
| -------- | -------- |
| `admin`  | `admin`  |

**Change this password immediately in any real deployment.**
