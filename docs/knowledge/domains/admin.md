# Domain: Admin

Administrative read models: aggregate stats, role-to-permission report and the audit log listing, plus the admin dashboard, analytics, monitoring and settings pages.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/admin.py` | Router `/admin` | `read_audit_logs`, `read_admin_stats`, `read_permission_report` |
| `backend/app/services/admin.py` | Service | `AdminService.get_stats`, `_count` |
| `backend/app/schemas/admin.py` | Schema | `AdminStats` |
| `backend/app/repositories/role.py` | Used directly by the router | `RoleRepository` (`list_items`) |
| `frontend/app/admin/page.tsx` | Admin dashboard | `adminApi.getStats`, `adminApi.getRecentJobs`, `scansApi.runFull`, `jobsApi.start` |
| `frontend/app/admin/analytics/page.tsx` | Analytics page | `adminApi.getStats`, `adminApi.getAuditLogs`, `jobsApi.getAll`, `scansApi.getStatus` |
| `frontend/app/admin/monitoring/page.tsx` | Monitoring page | `adminApi.getStats`, `healthApi.*`, `jobMonitorApi.*`, `scansApi.getStatus` |
| `frontend/app/admin/settings/page.tsx` | Settings page (read only) | `healthApi.*`, `jobMonitorApi.*`, `librariesApi.getAll`, `scansApi.getStatus` |
| `frontend/components/common/user-analytics-dashboard.tsx` | Component | `UserAnalyticsDashboard` |
| `frontend/components/common/prometheus-metrics-panel.tsx` | Component (fetches `/api/metrics` directly) | `PrometheusMetricsPanel` |
| `frontend/components/common/trend-visualization.tsx` | Component | `TrendVisualization`, `MAX_TREND_SAMPLES` |
| `frontend/components/common/pagination-controls.tsx` | Component (generic) | `PaginationControls` |
| `frontend/components/layout/sidebar.tsx` | Navigation incl. admin links | `Sidebar` |
| `frontend/lib/api/admin.ts` | API module | `adminApi.getStats`, `getAuditLogs`, `getPermissionReport`, `getRecentJobs` |
| `frontend/lib/types/admin.ts` | Types | `AdminStats`, `AuditLogRead`, `AuditLogQuery`, `PermissionReport` |
| `backend/tests/test_admin_api.py` | Backend test | |
| `frontend/app/admin/page.test.tsx`, `frontend/components/common/user-analytics-dashboard.test.tsx`, `frontend/components/common/prometheus-metrics-panel.test.tsx`, `frontend/components/common/trend-visualization.test.tsx`, `frontend/e2e/admin.spec.ts`, `frontend/e2e/visual.spec.ts` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.admin` |
| Service | `service:app.services.admin.AdminService` |
| Schema | `schema:app.schemas.admin.AdminStats` |
| Page | `page:/admin`, `page:/admin/analytics`, `page:/admin/monitoring`, `page:/admin/settings` |
| Component | `comp:components/common/user-analytics-dashboard`, `comp:components/common/prometheus-metrics-panel`, `comp:components/common/trend-visualization` |
| ApiModule | `apimod:lib/api/admin` |
| TypeModule | `typemod:lib/types/admin` |
| TestFile | `test:backend/tests/test_admin_api.py`, `test:frontend/e2e/admin.spec.ts`, `test:frontend/e2e/visual.spec.ts`, `test:frontend/app/admin/page.test.tsx` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/admin/audit-logs` | `read_audit_logs` (`backend/app/api/admin.py`) | VIEW_AUDIT_LOGS | `apifn:lib/api/admin.adminApi.getAuditLogs` |
| GET | `/api/admin/stats` | `read_admin_stats` (`backend/app/api/admin.py`) | ACCESS_ADMIN | `apifn:lib/api/admin.adminApi.getStats` |
| GET | `/api/admin/permission-report` | `read_permission_report` (`backend/app/api/admin.py`) | ACCESS_ADMIN | `apifn:lib/api/admin.adminApi.getPermissionReport` |

## Tables
Read only: `archive_entries`, `collections`, `tags`, `developers`, `publishers`, `franchises`, `users` (counts), `roles`, `permissions`, `role_permissions` (report), `audit_logs`.

## Change guide
- New dashboard stat: compute it in `AdminService.get_stats` (`backend/app/services/admin.py`), add the field to `AdminStats` in `backend/app/schemas/admin.py` and in `frontend/lib/types/admin.ts`, render in `frontend/app/admin/page.tsx`.
- New admin page: create `page.tsx` in a new folder under `frontend/app/admin/`, guarded with `useRequireAdmin` and link it from `frontend/components/layout/sidebar.tsx`.

## Notes
- `metadata_coverage` = non-`UNMATCHED` share of active entries; `verification_coverage` = non-`UNKNOWN` share; both percentages rounded to 2 decimals.
- `AdminService._count(..., active_only=True)` filters `deleted_at IS NULL` only for models that have the column (entries, collections, users).
- `GET /api/admin/permission-report` has no `response_model`; it returns `{role_name: [permission_name, ...]}`.
- `adminApi.getRecentJobs` is `jobsApi.getAll(undefined, undefined, 0, 10)`.
- All admin pages call `useRequireAdmin` (superuser only).
