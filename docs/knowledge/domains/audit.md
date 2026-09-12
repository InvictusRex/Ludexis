# Domain: Audit

Append-only `audit_logs` rows written by routers through two parallel services, and read through the admin audit-log endpoint and several frontend history widgets.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/services/audit.py` | Writer/reader (takes a `User`) | `AuditService.record`, `list_logs` |
| `backend/app/services/audit_log.py` | Writer (takes a `user_id`) | `AuditLogService.log` |
| `backend/app/repositories/audit_log.py` | Repository | `AuditLogRepository.list_items` (+ `BaseRepository.create`) |
| `backend/app/models/audit_log.py` | Model | `AuditLog` |
| `backend/app/schemas/audit_log.py` | Schemas | `AuditLogRead`, `AuditLogBase` |
| `backend/app/utils/audit_actions.py` | Action constants | `AuditAction` |
| `backend/app/api/admin.py` | Read endpoint (admin domain) | `read_audit_logs` |
| `frontend/app/admin/audit-logs/page.tsx` | Audit log page | `adminApi.getAuditLogs` |
| `frontend/components/common/account-activity-list.tsx` | Component | `AccountActivityList` |
| `frontend/components/common/user-analytics-dashboard.tsx` | Component | `UserAnalyticsDashboard` |
| `frontend/components/common/metadata-history-card.tsx`, `frontend/components/common/metadata-audit-trail.tsx`, `frontend/components/common/artwork-version-history.tsx` | Components (filter `entity="ArchiveEntry"`) | `MetadataHistoryCard`, `MetadataAuditTrail`, `ArtworkVersionHistory` |
| `frontend/lib/api/admin.ts` | API module | `adminApi.getAuditLogs` |
| `frontend/lib/types/admin.ts` | Types | `AuditLogRead`, `AuditLogQuery` |
| `backend/tests/test_admin_api.py` | Backend test (audit-log filters and permission) | |
| `frontend/components/common/account-activity-list.test.tsx`, `frontend/components/common/user-analytics-dashboard.test.tsx` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Service | `service:app.services.audit.AuditService`, `service:app.services.audit_log.AuditLogService` |
| Repository | `repo:app.repositories.audit_log.AuditLogRepository` |
| Model | `model:app.models.audit_log.AuditLog` |
| Schema | `schema:app.schemas.audit_log.AuditLogRead` |
| Module | `module:app.utils.audit_actions` |
| Table | `table:audit_logs` |
| Page | `page:/admin/audit-logs` |
| Component | `comp:components/common/account-activity-list`, `comp:components/common/user-analytics-dashboard` |
| ApiFunction | `apifn:lib/api/admin.adminApi.getAuditLogs` |
| TypeModule | `typemod:lib/types/admin` |

## API Endpoints
No router of its own. Read path: `GET /api/admin/audit-logs` (`read_audit_logs` in `backend/app/api/admin.py`, permission `VIEW_AUDIT_LOGS`, query `user_id`, `entity`, `action`, `offset`, `limit`; newest first). Frontend caller: `apifn:lib/api/admin.adminApi.getAuditLogs`.

## Who writes what
| Writer | Used by | `action` values |
|---|---|---|
| `AuditService.record(db, user, action, entity, ...)` | `archive_entries.py`, `collections.py`, `tags.py`, `developers.py`, `publishers.py`, `franchises.py` | plain strings: `create`, `update` (also used for collection add/remove entry), `delete`, `MANUAL_METADATA_OVERRIDE` |
| `AuditLogService.log(db, action, entity, ...)` | `auth.py`, `users.py`, `roles.py`, `libraries.py`, `scan.py` | `AuditAction` constants (`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`, `ASSIGN_ROLE`, `REMOVE_ROLE`, `CREATE_ROLE`, `UPDATE_ROLE`, `DELETE_ROLE`, `CREATE_LIBRARY`, `UPDATE_LIBRARY`, `DELETE_LIBRARY`, `RUN_FULL_SCAN`, `RUN_INCREMENTAL_SCAN`) |

## Tables
`audit_logs` (`user_id` FK to `users` with `ON DELETE SET NULL`).

## Change guide
- Audit a new action: call `AuditLogService.log` with a new constant in `backend/app/utils/audit_actions.py` (preferred, typed) or `AuditService.record` with the current `User`.
- New filter on the log list: `AuditLogRepository.list_items`, `AuditService.list_logs`, `read_audit_logs` in `backend/app/api/admin.py`, then `AuditLogQuery` (`frontend/lib/types/admin.ts`) and `adminApi.getAuditLogs`.

## Notes
- No update/delete endpoints exist for audit rows.
- Not audited: artwork routes, metadata routes, `/permissions` writes, `jobs` start/cancel, user activate/deactivate/reset-password, `POST /api/setup/initialize`.
- `MetadataHistoryCard`, `MetadataAuditTrail` and `ArtworkVersionHistory` render on `frontend/app/archive/[id]/page.tsx` but call an endpoint that requires `VIEW_AUDIT_LOGS`, so users without it get 403 from those widgets.
