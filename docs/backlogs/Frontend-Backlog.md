# Frontend Backlog

## Frontend Architecture Refactor

### ✅~~High Priority~~

- ✅~~Split `lib/types.ts` into domain-specific type modules.~~
- ✅~~Align frontend types with backend schemas.~~
- ✅~~Remove outdated frontend-only models.~~
- ✅~~Replace mock authentication models with backend token models.~~
- ✅~~Create centralized API module structure.~~
- ✅~~Move mock data into a dedicated `mock/` directory.~~
- ✅~~Remove generated comment banners and unnecessary boilerplate.~~
- ✅~~Remove remaining v0-generated metadata and placeholders.~~
- ✅~~Establish frontend folder structure and coding conventions.~~

### Medium Priority

- Create shared API error types.
- Create shared loading state types.
- Create shared pagination utilities.
- Introduce common frontend constants and configuration modules.

### Low Priority

- Introduce barrel exports for types and API modules.
- Create reusable frontend utility helpers.

---

## API Integration Foundation

### High Priority

- ✅~~Replace mock API layer with a real FastAPI client.~~
- ✅~~Create centralized API client configuration.~~
- ✅~~Add environment-based backend URL configuration.~~
- ✅~~Add authenticated request helpers.~~
- Add global API error handling.
- ✅~~Add loading and error state handling for API requests.~~
- ✅~~Remove simulated API delays.~~

### Medium Priority

- Add request retry handling for transient failures.
- Add toast notifications for API success and error events.
- Add standardized API response handling utilities.

### Low Priority

- Add API request logging for development environments.

---

## Authentication & Authorization

### High Priority

- ✅~~Create AuthProvider.~~
- ✅~~Integrate `/api/auth/login`.~~
- ✅~~Integrate `/api/auth/refresh`.~~
- ✅~~Integrate `/api/auth/me`.~~
- ✅~~Implement access token persistence.~~
- ✅~~Implement refresh token persistence.~~
- Implement automatic token refresh workflow.
- Implement logout token revocation.
- ✅~~Replace mock login page.~~
- Implement protected route middleware.
- ✅~~Implement session persistence across refreshes.~~

### Medium Priority

- Display current user information.
- Display effective permissions.
- Add user profile dropdown.
- Add authentication status indicators.

### Low Priority

- Session expiration warning.
- Automatic logout on refresh token expiration.
- Account activity information.

---

## Archive Library Integration

### High Priority

- ✅~~Replace mock archive services.~~
- ✅~~Align archive models with backend `ArchiveEntryRead` schema.~~
- ✅~~Connect archive listing page to backend.~~
- ✅~~Connect archive detail page to backend.~~
- Implement pagination support.
- Implement archive search integration.
- Implement metadata status filtering.
- Implement archive update workflows.
- ✅~~Implement archive detail retrieval.~~

### Medium Priority

- Bulk archive actions.
- Archive deletion confirmation flows.
- Archive duplicate visualization.
- Archive verification status indicators.

### Low Priority

- Advanced search builder.
- Saved search presets.

---

## Metadata Management

### High Priority

- Integrate metadata search endpoints.
- Integrate metadata details endpoints.
- Integrate metadata refresh workflows.
- Integrate manual metadata override workflows.
- Display metadata provider information.
- Display metadata status information.

### Medium Priority

- Metadata conflict review interface.
- Metadata confidence visualization.
- Provider source badges.
- Metadata history display.

### Low Priority

- Side-by-side metadata comparison view.
- Metadata audit trail visualization.

---

## Artwork Management

### High Priority

- Integrate artwork upload endpoints.
- Integrate artwork replacement endpoints.
- Integrate artwork deletion endpoints.
- Integrate artwork auto-download workflows.
- Integrate missing artwork page.
- Display artwork availability status.

### Medium Priority

- Screenshot gallery viewer.
- Drag-and-drop artwork uploads.
- Artwork preview dialogs.
- Artwork management modal.

### Low Priority

- Artwork quality indicators.
- Artwork comparison tools.
- Artwork version history.

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

- Collection creation workflows.
- Collection editing workflows.
- Collection membership management.
- Taxonomy relationship visualization.

### Low Priority

- Collection statistics dashboard.
- Collection recommendation workflows.

---

## Administration

### High Priority

- Users management integration.
- Audit log integration.
- Library management integration.
- System configuration integration.

### Medium Priority

- Roles management integration.
- Permissions management integration.
- Administrative dashboards.
- User activity summaries.

### Low Priority

- Administrative reporting tools.
- User analytics dashboards.

---

## Jobs & Background Processing

### High Priority

- Integrate job creation.
- Integrate job status monitoring.
- Integrate job cancellation.
- Real-time job progress visualization.
- Job status notifications.

### Medium Priority

- Job history filtering.
- Job analytics dashboard.
- Scan progress dashboard.
- Job activity dashboard.

### Low Priority

- Historical job reporting.
- Background task analytics.

---

## Monitoring & Observability

### High Priority

- Health endpoint dashboard.
- Backend status visualization.
- Database health visualization.
- Redis health visualization.
- Service availability indicators.

### Medium Priority

- Prometheus metrics dashboard.
- Grafana integration links.
- Scan statistics widgets.
- Infrastructure overview page.

### Low Priority

- Live operational dashboard.
- Long-term trend visualization.

---

## UX & Production Readiness

### High Priority

- Replace all remaining mock data.
- Remove development placeholders.
- ✅~~Remove mock authentication flows.~~
- ✅~~Remove simulated API delays.~~
- Add comprehensive loading skeletons.
- Add empty states.
- Add error boundaries.
- Responsive layout validation.
- Accessibility validation.

### Medium Priority

- Keyboard navigation review.
- Theme polish.
- Mobile usability review.
- Visual consistency review.

### Low Priority

- Micro-interactions.
- Animation polish.
- Enhanced transitions.

---

## Testing & Quality Assurance

### High Priority

- Authentication integration tests.
- API integration tests.
- Protected route tests.
- Error handling tests.
- Frontend-backend integration validation.

### Medium Priority

- Component tests.
- Page-level tests.
- API mocking infrastructure for tests.

### Low Priority

- End-to-end Playwright suite.
- Visual regression testing.

---

## Release Preparation

### High Priority

- Remove all remaining mock infrastructure.
- Production build validation.
- Docker deployment validation.
- Cross-browser testing.
- Frontend documentation update.
- Screenshot generation for README.
- Release candidate testing.

### Medium Priority

- Demo dataset creation.
- Demo environment configuration.
- Release notes preparation.

### Low Priority

- Public demo deployment.
- Hosted showcase environment.

---

# Frontend Milestones

## Milestone 1 — Real Authentication

- API Client
- Auth Provider
- Login Integration
- Refresh Tokens
- Protected Routes
- Session Persistence

## Milestone 2 — Archive Integration

- Archive Library
- Metadata Workflows
- Artwork Management
- Search

## Milestone 3 — Administrative Workflows

- Users
- Audit Logs
- Jobs
- Monitoring

## Milestone 4 — Production Readiness

- Testing
- Documentation
- Deployment Validation
- Release Preparation
