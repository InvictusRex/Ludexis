# Domain: RBAC

## Overview
Role-Based Access Control — manages roles, permissions, and their assignments to users. Enforced via FastAPI dependencies on protected endpoints.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Model | `model:app.models.role.Role` | Role |
| Model | `model:app.models.permission.Permission` | Permission |
| Repository | `repo:app.repositories.role.RoleRepository` | RoleRepository |
| Repository | `repo:app.repositories.permission.PermissionRepository` | PermissionRepository |
| Schema | `schema:app.schemas.role.RoleRead` | RoleRead |
| Schema | `schema:app.schemas.permission.PermissionRead` | PermissionRead |

## Related Tables
- `roles` — role definitions
- `permissions` — permission definitions
- `role_permissions` — many-to-many junction

## Permissions
| Permission | Description |
|------------|-------------|
| `MANAGE_USERS` | Create/update/delete users, roles, permissions |
| `EDIT_METADATA` | Edit archive entry metadata, tags, developers, etc. |
| `RUN_SCANS` | Start/cancel background scan jobs |
| `VIEW_AUDIT_LOGS` | View audit log entries |
| `ACCESS_ADMIN` | Access admin dashboard and stats |

## API Endpoints
- `GET /roles/` — list roles
- `POST /roles/` — create role
- `GET /roles/{id}` — get role
- `PATCH /roles/{id}` — update role
- `DELETE /roles/{id}` — delete role
- `GET /permissions/` — list permissions
- `POST /permissions/` — create permission
- `GET /permissions/{id}` — get permission

## Notes
- Default roles: `admin`, `user` (seeded at setup)
- Roles have many-to-many relationship with permissions
- Users have many-to-many relationship with roles
- RBAC checks performed via `require_permission()` FastAPI dependency
