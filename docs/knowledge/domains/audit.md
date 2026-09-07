# Domain: Audit

## Overview
Audit logging — immutable record of all security-relevant actions for compliance and debugging.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.audit_log.AuditLog` | AuditLog |
| Repository | `repo:app.repositories.audit_log.AuditLogRepository` | AuditLogRepository |
| Service | `service:app.services.audit.AuditService` | AuditService |
| Service | `service:app.services.audit_log.AuditLogService` | AuditLogService |
| Schema | `schema:app.schemas.audit_log.AuditLogRead` | AuditLogRead |

## Related Tables
- `audit_logs` — audit log entries

## API Endpoints
- `GET /admin/audit-logs` — list audit logs (requires VIEW_AUDIT_LOGS)

## Audit Actions
| Action | Description |
|--------|-------------|
| `user.login` | User login |
| `user.logout` | User logout |
| `user.create` | User created |
| `user.update` | User updated |
| `user.delete` | User deleted |
| `role.create` | Role created |
| `permission.create` | Permission created |
| `archive_entry.create` | Archive entry created |
| `archive_entry.update` | Archive entry updated |
| `scan.start` | Scan job started |

## Notes
- Audit logs are append-only (no update/delete)
- Each entry records: user_id, action, entity, entity_id, details (JSONB)
- AuditService wraps AuditLogService with user context extraction
- Filterable by action, entity, user_id, date range
