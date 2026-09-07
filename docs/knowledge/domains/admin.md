# Domain: Admin

## Overview
Administration — provides system-wide statistics, permission reports, and audit log access for admin users.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.admin.AdminService` | AdminService |
| Schema | `schema:app.schemas.admin.AdminStats` | AdminStats |

## Related Tables (direct reads)
- `archive_entries`
- `collections`
- `tags`
- `developers`
- `publishers`
- `franchises`
- `users`

## API Endpoints
- `GET /admin/stats` — system statistics (requires ACCESS_ADMIN)
- `GET /admin/audit-logs` — audit log list (requires VIEW_AUDIT_LOGS)
- `GET /admin/permission-report` — role-permission mapping (requires ACCESS_ADMIN)

## Notes
- AdminService reads directly from 7 tables (no repository layer)
- Stats include counts for all major entities plus metadata/verification coverage
- Permission report shows role-to-permission mapping
