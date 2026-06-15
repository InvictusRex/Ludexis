# Frontend Backlog

## Phase 1 — Backend Integration Foundation

### High Priority

- Replace mock API layer with real FastAPI client.
- Add centralized API client configuration.
- Add environment-based backend URL configuration.
- Implement access token storage.
- Implement refresh token workflow.
- Implement automatic token refresh interceptor.
- Implement logout token revocation.
- Add authenticated request helpers.
- Add global API error handling.
- Add loading and error states for API requests.

### Medium Priority

- Add API response typing aligned with backend schemas.
- Add request retry handling for transient failures.
- Add toast notifications for API success/error events.

---

## Phase 2 — Authentication & Authorization

### High Priority

- Replace mock login page with real backend authentication.
- Integrate `/api/auth/login`.
- Implement session persistence.
- Implement protected route middleware.
- Integrate `/api/auth/me`.
- Add current user context provider.
- Implement logout workflow.

### Medium Priority

- Display current user information.
- Display user roles.
- Display effective permissions.

### Low Priority

- Session expiration warning.
- Automatic logout on refresh token expiration.

---

## Phase 3 — Archive Library Integration

### High Priority

- Connect archive listing page to backend.
- Connect archive detail page to backend.
- Implement pagination support.
- Implement search integration.
- Implement metadata status filtering.
- Implement archive update workflows.

### Medium Priority

- Bulk archive actions.
- Archive deletion confirmation flows.
- Archive duplicate visualization.

### Low Priority

- Advanced search builder.

---

## Phase 4 — Metadata Management

### High Priority

- Integrate metadata search endpoints.
- Integrate metadata details endpoints.
- Integrate metadata refresh workflows.
- Integrate manual metadata override workflow.

### Medium Priority

- Metadata conflict review interface.
- Metadata confidence visualization.
- Provider source badges.

### Low Priority

- Side-by-side metadata comparison view.

---

## Phase 5 — Artwork Management

### High Priority

- Integrate artwork upload endpoints.
- Integrate artwork replacement endpoints.
- Integrate artwork deletion endpoints.
- Integrate artwork auto-download workflows.
- Integrate missing artwork page.

### Medium Priority

- Screenshot gallery viewer.
- Drag-and-drop artwork uploads.
- Artwork preview dialogs.

### Low Priority

- Artwork quality indicators.
- Artwork comparison tools.

---

## Phase 6 — Collections & Taxonomy

### High Priority

- Integrate collections pages.
- Integrate developers pages.
- Integrate publishers pages.
- Integrate tags pages.
- Integrate franchises pages.

### Medium Priority

- Collection creation workflows.
- Collection editing workflows.

### Low Priority

- Collection statistics dashboard.

---

## Phase 7 — Administration

### High Priority

- Users management integration.
- Roles management integration.
- Permissions management integration.
- Audit log integration.
- Library management integration.

### Medium Priority

- Administrative dashboards.
- User activity summaries.

---

## Phase 8 — Jobs & Background Processing

### High Priority

- Integrate job creation.
- Integrate job status monitoring.
- Integrate job cancellation.
- Real-time job progress visualization.

### Medium Priority

- Job history filtering.
- Job analytics dashboard.

---

## Phase 9 — Monitoring & Observability

### High Priority

- Health endpoint dashboard.
- Backend status visualization.
- Database health visualization.
- Redis health visualization.

### Medium Priority

- Prometheus metrics dashboard.
- Grafana integration links.
- Scan statistics widgets.

### Low Priority

- Live operational dashboard.

---

## Phase 10 — UX & Production Readiness

### High Priority

- Replace all remaining mock data.
- Remove development placeholders.
- Add comprehensive loading skeletons.
- Add empty states.
- Add error boundaries.
- Responsive layout validation.

### Medium Priority

- Accessibility review.
- Keyboard navigation review.
- Theme polish.

### Low Priority

- Micro-interactions.
- Animation polish.

---

## Testing

### High Priority

- Authentication integration tests.
- API integration tests.
- Protected route tests.
- Error handling tests.

### Medium Priority

- Component tests.
- Page-level tests.

### Low Priority

- End-to-end Playwright suite.
