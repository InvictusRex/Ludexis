# Domain: Admin

Administrative read models: aggregate stats, role-to-permission report and the audit log listing, plus the admin dashboard, analytics, monitoring and settings pages.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/admin.py` | Router `/admin` | `read_audit_logs`, `read_admin_stats`, `read_permission_report` |
| `backend/app/services/admin.py` | Service | `AdminService.get_stats`, `_count` |
| `backend/app/schemas/admin.py` | Schema | `AdminStats` |
| `backend/app/repositories/role.py` | Used directly by the router | `RoleRepository` (`list_items`) |
| `frontend/app/(app)/admin/page.tsx` | Admin dashboard | `adminApi.getStats`, `adminApi.getRecentJobs`, `scansApi.runFull`, `jobsApi.start` |
| `frontend/app/(app)/admin/settings/page.tsx` | Settings page (read only) | `healthApi.*`, `jobMonitorApi.*`, `librariesApi.getAll`, `scansApi.getStatus` |
| `frontend/lib/api/admin.ts` | API module | `adminApi.getStats`, `getAuditLogs`, `getPermissionReport`, `getRecentJobs` |
| `frontend/lib/types/admin.ts` | Types | `AdminStats`, `AuditLogRead`, `AuditLogQuery`, `PermissionReport` |
| `backend/tests/test_admin_api.py` | Backend test | |
| `frontend/app/(app)/admin/page.test.tsx`,  `frontend/e2e/admin.spec.ts`, `frontend/e2e/visual.spec.ts` | Frontend tests | |
| `frontend/components/admin/common.tsx` | Component | `SectionHeader`, `StatusDot`, `Status`, `JobStatus`, `isActiveJob`, `humanize` |
| `frontend/components/admin/duplicate-group-card.tsx` | Component | `DuplicateGroupCard` |
| `frontend/components/admin/review-queue.tsx` | Component | `ReviewQueue` |
| `frontend/components/admin/section-nav.tsx` | Component | `SectionNav` |
| `frontend/components/admin/server-settings-form.tsx` | Component | `ServerSettingsForm` |
| `frontend/app/(app)/admin/layout.tsx` | Layout `/admin` | `DashboardLayout` |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.admin` |
| Service | `service:app.services.admin.AdminService` |
| Schema | `schema:app.schemas.admin.AdminStats` |
| Page | `page:/admin`, `page:/admin/settings` |
| ApiModule | `apimod:lib/api/admin` |
| TypeModule | `typemod:lib/types/admin` |
| TestFile | `test:backend/tests/test_admin_api.py`, `test:frontend/e2e/admin.spec.ts`, `test:frontend/e2e/visual.spec.ts` |
| Component | `comp:components/admin/common`, `comp:components/admin/duplicate-group-card`, `comp:components/admin/review-queue`, `comp:components/admin/section-nav`, `comp:components/admin/server-settings-form` |
| Layout | `layout:/(app)/admin` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/admin/audit-logs` | `read_audit_logs` (`backend/app/api/admin.py`) | VIEW_AUDIT_LOGS | `apifn:lib/api/admin.adminApi.getAuditLogs` |
| GET | `/api/admin/stats` | `read_admin_stats` (`backend/app/api/admin.py`) | ACCESS_ADMIN | `apifn:lib/api/admin.adminApi.getStats` |
| GET | `/api/admin/permission-report` | `read_permission_report` (`backend/app/api/admin.py`) | ACCESS_ADMIN |  |

## Tables
Read only: `archive_entries`, `collections`, `tags`, `developers`, `publishers`, `franchises`, `users` (counts), `roles`, `permissions`, `role_permissions` (report), `audit_logs`.

## Change guide
- New dashboard stat: compute it in `AdminService.get_stats` (`backend/app/services/admin.py`), add the field to `AdminStats` in `backend/app/schemas/admin.py` and in `frontend/lib/types/admin.ts`, render in `frontend/app/(app)/admin/page.tsx`.
- New admin page: create `page.tsx` in a new folder under `frontend/app/(app)/admin/`, guarded with `useRequirePermission`, and add it to the section list in `frontend/components/admin/sections.ts`.

## Notes
- `metadata_coverage` = non-`UNMATCHED` share of active entries; `verification_coverage` = non-`UNKNOWN` share; both percentages rounded to 2 decimals.
- `AdminService._count(..., active_only=True)` filters `deleted_at IS NULL` only for models that have the column (entries, collections, users).
- `GET /api/admin/permission-report` has no `response_model`; it returns `{role_name: [permission_name, ...]}`.
- `adminApi.getRecentJobs` is `jobsApi.getAll(undefined, undefined, 0, 10)`.
- All admin pages call `useRequireAdmin` (superuser only).
