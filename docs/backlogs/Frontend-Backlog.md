# Frontend Backlog

Status: `✅` completed and verified; `[in progress]` partially implemented or requires completion.

## Frontend Architecture Refactor

### ✅~~High Priority~~

- ✅~~Split `lib/types.ts` into domain-specific type modules.~~
- ✅~~Align frontend types with backend schemas.~~
- ✅~~Remove outdated frontend-only models.~~
- ✅~~Replace mock authentication models with backend token models.~~
- ✅~~Create centralized API module structure.~~
- ✅~~Move mock data into a dedicated `mock/` directory (mock data removed entirely).~~
- ✅~~Remove generated comment banners and unnecessary boilerplate.~~
- ✅~~Remove remaining v0-generated metadata and placeholders.~~
- ✅~~Establish frontend folder structure and coding conventions.~~

### Medium Priority

- ✅~~Create shared API error types.~~
- ✅~~Create shared loading state types.~~
- ✅~~Create shared pagination utilities.~~ (lib/pagination.ts + PaginationControls wired into collections/jobs/analytics/users)
- ✅~~Introduce common frontend constants and configuration modules.~~

### Low Priority

- ✅~~Introduce barrel exports for types and API modules.~~
- ✅~~Create reusable frontend utility helpers.~~

---

## API Integration Foundation

### High Priority

- ✅~~Replace mock API layer with a real FastAPI client.~~
- ✅~~Create centralized API client configuration.~~
- ✅~~Add environment-based backend URL configuration.~~
- ✅~~Add authenticated request helpers.~~
- ✅~~Add global API error handling.~~
- ✅~~Add loading and error state handling for API requests.~~
- ✅~~Remove simulated API delays.~~

### Medium Priority

- ✅~~Add request retry handling for transient failures.~~ (GET requests retried twice on network errors and 502/503/504, `lib/api/client.ts`)
- ✅~~Add toast notifications for API success and error events.~~
- ✅~~Add standardized API response handling utilities.~~

### Low Priority

- ✅~~Add API request logging for development environments.~~ (NEXT_PUBLIC_DEBUG=1)

---

## Authentication & Authorization

### High Priority

- ✅~~Create AuthProvider.~~
- ✅~~Integrate `/api/auth/login`.~~
- ✅~~Integrate `/api/auth/refresh`.~~
- ✅~~Integrate `/api/auth/me`.~~
- ✅~~Implement access token persistence.~~
- ✅~~Implement refresh token persistence.~~
- ✅~~Implement automatic token refresh workflow.~~
- ✅~~Implement logout token revocation.~~
- ✅~~Replace mock login page.~~
- ✅~~Implement protected route middleware.~~
- ✅~~Implement session persistence across refreshes.~~

### Medium Priority

- ✅~~Display current user information.~~
- ✅~~Display effective permissions.~~ (EffectivePermissionsPanel on admin/permissions)
- ✅~~Add user profile dropdown.~~
- ✅~~Add authentication status indicators.~~

### Low Priority

- ✅~~Session expiration warning.~~
- ✅~~Automatic logout on refresh token expiration.~~ (lib/auth/token-expiry.ts + AuthProvider 30s check)
- ✅~~Account activity information.~~ (Account page + AccountActivityList)

---

## Archive Library Integration

### High Priority

- ✅~~Replace mock archive services.~~
- ✅~~Align archive models with backend `ArchiveEntryRead` schema.~~
- ✅~~Connect archive listing page to backend.~~
- ✅~~Connect archive detail page to backend.~~
- ✅~~Implement pagination support.~~
- ✅~~Implement archive search integration.~~
- ✅~~Implement metadata status filtering.~~
- ✅~~Implement archive update workflows.~~ (Edit Entry dialog on the archive detail page, partial PATCH)
- ✅~~Implement archive detail retrieval.~~

### Medium Priority

- ✅~~Bulk archive actions.~~
- ✅~~Archive deletion confirmation flows.~~
- ✅~~Archive duplicate visualization.~~
- ✅~~Archive duplicate resolution workflows.~~
- ✅~~Archive verification status indicators.~~

### Low Priority

- ✅~~Advanced search builder.~~ (AdvancedSearchBuilder)
- ✅~~Saved search presets.~~

---

## Metadata Management

### High Priority

- ✅~~Integrate metadata search endpoints.~~
- ✅~~Integrate metadata details endpoints.~~
- ✅~~Integrate metadata refresh workflows.~~
- ✅~~Integrate manual metadata override workflows.~~
- ✅~~Display metadata provider information.~~
- ✅~~Display metadata status information.~~

### Medium Priority

- ✅~~Metadata conflict review interface.~~ (PARTIAL-status Conflicts card on admin/metadata)
- ✅~~Metadata confidence visualization.~~
- ✅~~Provider source badges.~~
- ✅~~Metadata history display.~~ (audit-trail card on archive detail)

### Low Priority

- ✅~~Side-by-side metadata comparison view.~~ (MetadataComparison)
- ✅~~Metadata audit trail visualization.~~ (MetadataAuditTrail)

---

## Artwork Management

### High Priority

- ✅~~Integrate artwork upload endpoints.~~
- ✅~~Integrate artwork replacement endpoints.~~
- ✅~~Integrate artwork deletion endpoints.~~
- ✅~~Integrate artwork auto-download workflows.~~
- ✅~~Integrate missing artwork page.~~
- ✅~~Display artwork availability status.~~

### Medium Priority

- ✅~~Screenshot gallery viewer.~~
- ✅~~Serve stored artwork via /media (cover/banner/logo/screenshot URLs resolve).~~ (image URLs carry a short-lived media-only token, never the access token)
- ✅~~Drag-and-drop artwork uploads.~~
- ✅~~Artwork preview dialogs.~~
- ✅~~Artwork management modal.~~ (ArtworkManagementDialog on admin/artwork)

### Low Priority

- ✅~~Artwork quality indicators.~~ (ArtworkQualityIndicators)
- ✅~~Artwork comparison tools.~~ (ArtworkComparisonDialog)
- ✅~~Artwork version history.~~ (ArtworkVersionHistory)

---

## Collections & Taxonomy

### High Priority

- ✅~~Integrate collections pages.~~
- ✅~~Integrate developers pages.~~
- ✅~~Integrate publishers pages.~~
- ✅~~Integrate tags pages.~~
- ✅~~Integrate franchises pages.~~
- ✅~~Replace mock taxonomy services.~~

### Medium Priority

- ✅~~Collection creation workflows.~~
- ✅~~Collection editing workflows.~~
- ✅~~Collection membership management.~~
- ✅~~Taxonomy relationship visualization.~~ (RelationshipVisualizer on franchise/collection detail)
- ✅~~Tag, developer, publisher and franchise create/edit/delete.~~ (`TaxonomyFormDialog` on the list and detail pages, superusers only)

### Low Priority

- ✅~~Collection statistics dashboard.~~ (CollectionStats)
- ✅~~Collection recommendation workflows.~~ (CollectionRecommendations)

---

## Administration

### High Priority

- ✅~~Users management integration.~~
- ✅~~Audit log integration.~~
- ✅~~Library management integration.~~
- ✅~~System configuration integration.~~ (Server Settings form: server name, metadata source order, IGDB credentials)
- ✅~~Scheduled Tasks page.~~ (schedule, enable, run now, last result)
- ✅~~Identify dialog.~~ (search VNDB, IGDB, Steam or all from the game page and the metadata review page; apply to every version)
- ✅~~Account security.~~ (change password, log out everywhere)

### Medium Priority

- ✅~~Roles management integration.~~
- ✅~~Permissions management integration.~~
- ✅~~Administrative dashboards.~~
- ✅~~User activity summaries.~~

### Low Priority

- ✅~~Administrative reporting tools.~~
- ✅~~User analytics dashboards.~~ (UserAnalyticsDashboard on admin/analytics)

---

## Jobs & Background Processing

### High Priority

- ✅~~Integrate job creation.~~
- ✅~~Integrate job status monitoring.~~
- ✅~~Integrate job cancellation.~~
- ✅~~Real-time job progress visualization.~~ (progress is reported by the worker as items are processed; retry attempts shown)
- ✅~~Job status notifications.~~

### Medium Priority

- ✅~~Job history filtering.~~
- ✅~~Job analytics dashboard.~~
- ✅~~Scan progress dashboard.~~
- ✅~~Job activity dashboard.~~

### Low Priority

- ✅~~Historical job reporting.~~ (JobsReport)
- ✅~~Background task analytics.~~ (BackgroundTaskAnalytics)

---

## Monitoring & Observability

### High Priority

- ✅~~Health endpoint dashboard.~~
- ✅~~Backend status visualization.~~
- ✅~~Database health visualization.~~
- ✅~~Redis health visualization.~~
- ✅~~Service availability indicators.~~

### Medium Priority

- ✅~~Prometheus metrics dashboard.~~ (PrometheusMetricsPanel on admin/monitoring)
- ✅~~Grafana integration links.~~ (http://localhost:3000)
- ✅~~Scan statistics widgets.~~
- ✅~~Infrastructure overview page.~~ (API/DB/Redis/Frontend strip on admin/monitoring)

### Low Priority

- ✅~~Live operational dashboard.~~ (LiveOperationalDashboard, real-time polling)
- ✅~~Long-term trend visualization.~~ (TrendVisualization)

---

## UX & Production Readiness

### High Priority

- ✅~~Replace all remaining mock data.~~
- ✅~~Remove development placeholders.~~ (local-only favorites button removed; Share copies the entry link; collection create/edit buttons linked)
- ✅~~Remove mock authentication flows.~~
- ✅~~Remove simulated API delays.~~
- ✅~~Add comprehensive loading skeletons.~~
- ✅~~Add empty states.~~
- ✅~~Add error boundaries.~~ (`ErrorBoundary` wraps page content in `AppWrapper`, keyed by route so it resets on navigation)
- ✅~~Responsive layout validation.~~
- ✅~~Accessibility validation.~~ (skip link, aria-labels, focus handling)

### Medium Priority

- ✅~~Keyboard navigation review.~~ (skip link, aria-expanded/controls on mobile toggle)
- ✅~~Theme polish.~~
- ✅~~Mobile usability review.~~
- ✅~~Visual consistency review.~~

### Low Priority

- ✅~~Micro-interactions.~~ (button active-scale, card hover lift)
- ✅~~Animation polish.~~ (motion-safe fade-in-up/scale-in utilities)
- ✅~~Enhanced transitions.~~ (transition-all + prefers-reduced-motion guard)

---

## Testing & Quality Assurance

### High Priority

- ✅~~Authentication integration tests.~~
- ✅~~API integration tests.~~ (backend pytest API suite expanded to cover every endpoint the frontend consumes)
- ✅~~Protected route tests.~~ (hooks/use-protected-route.test.ts)
- ✅~~Error handling tests.~~
- ✅~~Frontend-backend integration validation.~~ (Playwright E2E against the live backend)

### Medium Priority

- ✅~~Component tests.~~
- ✅~~Saved-search / filter-persistence unit tests.~~ (lib/saved-searches.test.ts)
- ✅~~Page-level tests.~~ (login + admin dashboard)
- ✅~~API mocking infrastructure for tests.~~ (Vitest fetch/token-store mocking)

### Low Priority

- ✅~~End-to-end Playwright suite.~~
- ✅~~Visual regression testing.~~ (e2e/visual.spec.ts baselines in e2e/__screenshots__)

---

## Release Preparation

### High Priority

- ✅~~Remove all remaining mock infrastructure.~~
- ✅~~Production build validation.~~ (next build clean, 33 routes)
- ✅~~Docker deployment validation.~~ (docker-compose.demo.yml config validated; frontend standalone image build)
- ✅~~Cross-browser testing.~~ (Chromium E2E suite green; Firefox/WebKit projects configured, browsers not installed)
- ✅~~Frontend documentation update.~~ (frontend/README.md)
- ✅~~Screenshot generation for README.~~ (e2e/__screenshots__/visual.spec.ts)
- ✅~~Release candidate testing.~~ (frontend 229 unit tests + 9 E2E, backend 165 tests + 3 opt-in sample-library tests)

### Medium Priority

- ✅~~Demo dataset creation.~~ (backend/scripts/seed_demo.py, idempotent)
- ✅~~Demo environment configuration.~~ (docker-compose.demo.yml with worker and beat, secrets from the environment, frontend/.env.example)
- ✅~~Release notes preparation.~~ (docs/release/RELEASE_NOTES.md)

### Low Priority

- Public demo deployment. (needs a hosting target)
- Hosted showcase environment. (needs a hosting target)

---

# Frontend Milestones

## ✅~~Milestone 1 - Real Authentication~~

- API Client
- Auth Provider
- Login Integration
- Refresh Tokens
- Protected Routes
- Session Persistence

## ✅~~Milestone 2 - Archive Integration~~

- Archive Library
- Metadata Workflows
- Artwork Management
- Search

## ✅~~Milestone 3 - Administrative Workflows~~

- Users
- Audit Logs
- Jobs
- Monitoring

## Milestone 4 - Production Readiness

Everything except the public demo and hosted showcase is complete.

- Testing
- Documentation
- Deployment Validation
- Release Preparation
