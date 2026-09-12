# Domain: RBAC

Users, roles and permissions. A user holds roles (`user_roles`), a role holds permissions (`role_permissions`). Routes enforce a single `PermissionName` through `require_permission`; superusers bypass every check. There is no service layer: routers call repositories directly.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/users.py` | Router `/users` | `list_users`, `create_user`, `read_user`, `update_user`, `delete_user`, `activate_user`, `deactivate_user`, `reset_password`, `_require_manage_users_if_initialized`, `_load_roles`, `_get_user_or_404` |
| `backend/app/api/roles.py` | Router `/roles` | `list_roles`, `create_role`, `read_role`, `update_role`, `delete_role`, `_load_permissions` |
| `backend/app/api/permissions.py` | Router `/permissions` | `list_permissions`, `create_permission`, `read_permission` |
| `backend/app/core/auth.py` | Enforcement | `ensure_permission`, `require_permission` |
| `backend/app/utils/enums.py` | Enums | `PermissionName`, `RoleName` |
| `backend/app/repositories/user.py` | Repository | `UserRepository.get_active`, `list_items`, `get_by_email`, `get_by_username`, `activate`, `deactivate`, `has_any` |
| `backend/app/repositories/role.py` | Repository | `RoleRepository.get_by_name` (+ `BaseRepository` CRUD) |
| `backend/app/repositories/permission.py` | Repository | `PermissionRepository.get_by_name` |
| `backend/app/models/role.py`, `backend/app/models/permission.py` | Models | `Role`, `Permission` |
| `backend/app/models/association_tables.py` | Join tables | `user_roles`, `role_permissions` |
| `backend/app/schemas/user.py` | Schemas | `UserCreate`, `UserUpdate`, `UserRead` |
| `backend/app/schemas/role.py` | Schemas | `RoleCreate`, `RoleUpdate`, `RoleRead` |
| `backend/app/schemas/permission.py` | Schemas | `PermissionCreate`, `PermissionRead` |
| `backend/seed_rbac.py` | Standalone seed script | seeds permissions + roles |
| `frontend/app/admin/users/page.tsx` | User admin page | `usersApi.*`, `rolesApi.getAll` |
| `frontend/app/admin/permissions/page.tsx` | Role/permission admin page | `rolesApi.getAll/create/remove`, `permissionsApi.getAll`, `adminApi.getPermissionReport` |
| `frontend/components/common/effective-permissions-panel.tsx` | Component | `EffectivePermissionsPanel` |
| `frontend/lib/api/users.ts`, `frontend/lib/api/roles.ts`, `frontend/lib/api/permissions.ts` | API modules | `usersApi`, `rolesApi`, `permissionsApi` |
| `frontend/lib/types/user.ts`, `frontend/lib/types/role.ts`, `frontend/lib/types/permission.ts` | Types | `User`, `UserCreate`, `UserUpdate`, `PasswordResetRequest`, `RoleRead`, `RoleCreate`, `RoleUpdate`, `PermissionRead`, `PermissionCreate` |
| `backend/tests/test_rbac.py`, `backend/tests/test_permissions.py`, `backend/tests/test_users_api.py` | Backend tests | |
| `frontend/components/common/effective-permissions-panel.test.tsx` | Frontend test | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.users`, `router:app.api.roles`, `router:app.api.permissions` |
| Repository | `repo:app.repositories.user.UserRepository`, `repo:app.repositories.role.RoleRepository`, `repo:app.repositories.permission.PermissionRepository` |
| Model | `model:app.models.role.Role`, `model:app.models.permission.Permission` |
| Schema | `schema:app.schemas.user.UserCreate`, `schema:app.schemas.user.UserUpdate`, `schema:app.schemas.user.UserRead`, `schema:app.schemas.role.RoleRead`, `schema:app.schemas.permission.PermissionRead` |
| DBEnum | `dbenum:permission_name`, `dbenum:role_name` (Python-only enums, see Notes) |
| Module | `module:app.core.auth`, `module:app.utils.enums`, `module:seed_rbac` |
| Table | `table:users`, `table:roles`, `table:permissions`, `table:user_roles`, `table:role_permissions` |
| Page | `page:/admin/users`, `page:/admin/permissions` |
| Component | `comp:components/common/effective-permissions-panel` |
| ApiModule | `apimod:lib/api/users`, `apimod:lib/api/roles`, `apimod:lib/api/permissions` |
| TypeModule | `typemod:lib/types/user`, `typemod:lib/types/role`, `typemod:lib/types/permission` |
| TestFile | `test:backend/tests/test_rbac.py`, `test:backend/tests/test_permissions.py`, `test:backend/tests/test_users_api.py` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/api/users/` | `list_users` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.getAll` |
| POST | `/api/users/` | `create_user` (`backend/app/api/users.py`) | MANAGE_USERS once any user exists (open before) | `apifn:lib/api/users.usersApi.create` |
| GET | `/api/users/{user_id}` | `read_user` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.getById` |
| PATCH | `/api/users/{user_id}` | `update_user` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.update` |
| DELETE | `/api/users/{user_id}` | `delete_user` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.remove` |
| POST | `/api/users/{user_id}/activate` | `activate_user` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.activate` |
| POST | `/api/users/{user_id}/deactivate` | `deactivate_user` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.deactivate` |
| POST | `/api/users/{user_id}/reset-password` | `reset_password` (`backend/app/api/users.py`) | MANAGE_USERS | `apifn:lib/api/users.usersApi.resetPassword` |
| GET | `/api/roles/` | `list_roles` (`backend/app/api/roles.py`) | MANAGE_USERS | `apifn:lib/api/roles.rolesApi.getAll` |
| POST | `/api/roles/` | `create_role` (`backend/app/api/roles.py`) | MANAGE_USERS | `apifn:lib/api/roles.rolesApi.create` |
| GET | `/api/roles/{role_id}` | `read_role` (`backend/app/api/roles.py`) | MANAGE_USERS | `apifn:lib/api/roles.rolesApi.getById` |
| PATCH | `/api/roles/{role_id}` | `update_role` (`backend/app/api/roles.py`) | MANAGE_USERS | `apifn:lib/api/roles.rolesApi.update` |
| DELETE | `/api/roles/{role_id}` | `delete_role` (`backend/app/api/roles.py`) | MANAGE_USERS | `apifn:lib/api/roles.rolesApi.remove` |
| GET | `/api/permissions/` | `list_permissions` (`backend/app/api/permissions.py`) | MANAGE_USERS | `apifn:lib/api/permissions.permissionsApi.getAll` |
| POST | `/api/permissions/` | `create_permission` (`backend/app/api/permissions.py`) | MANAGE_USERS | `apifn:lib/api/permissions.permissionsApi.create` |
| GET | `/api/permissions/{permission_id}` | `read_permission` (`backend/app/api/permissions.py`) | MANAGE_USERS | `apifn:lib/api/permissions.permissionsApi.getById` |

## Permission enforcement map
| Permission | Enforced on |
|---|---|
| VIEW_LIBRARY | not enforced by any route |
| EDIT_METADATA | POST `/api/archive-entries/`; PATCH `/api/archive-entries/{archive_entry_id}`; PATCH `/api/archive-entries/{archive_entry_id}/metadata`; DELETE `/api/archive-entries/{archive_entry_id}`; POST `/api/artwork/upload`; PATCH `/api/artwork/replace`; DELETE `/api/artwork/{artwork_id}`; POST `/api/artwork/auto-download`; POST `/api/developers/`; PATCH `/api/developers/{developer_id}`; DELETE `/api/developers/{developer_id}`; POST `/api/franchises/`; PATCH `/api/franchises/{franchise_id}`; DELETE `/api/franchises/{franchise_id}`; POST `/api/publishers/`; PATCH `/api/publishers/{publisher_id}`; DELETE `/api/publishers/{publisher_id}`; POST `/api/tags/`; PATCH `/api/tags/{tag_id}`; DELETE `/api/tags/{tag_id}` |
| MANAGE_COLLECTIONS | POST `/api/collections/`; PATCH `/api/collections/{collection_id}`; DELETE `/api/collections/{collection_id}`; POST `/api/collections/{collection_id}/entries`; DELETE `/api/collections/{collection_id}/entries/{entry_id}` |
| MANAGE_USERS | GET `/api/permissions/`; POST `/api/permissions/`; GET `/api/permissions/{permission_id}`; GET `/api/roles/`; POST `/api/roles/`; GET `/api/roles/{role_id}`; PATCH `/api/roles/{role_id}`; DELETE `/api/roles/{role_id}`; GET `/api/users/`; GET `/api/users/{user_id}`; PATCH `/api/users/{user_id}`; DELETE `/api/users/{user_id}`; POST `/api/users/{user_id}/activate`; POST `/api/users/{user_id}/deactivate`; POST `/api/users/{user_id}/reset-password`; POST `/api/users/` (via `_require_manage_users_if_initialized`) |
| RUN_SCANS | POST `/api/jobs/start`; POST `/api/jobs/{job_id}/cancel`; POST `/api/scan/full`; POST `/api/scan/incremental` |
| ACCESS_ADMIN | GET `/api/admin/stats`; GET `/api/admin/permission-report`; GET `/api/job-monitor/workers`; GET `/api/job-monitor/stats`; POST `/api/libraries/`; PATCH `/api/libraries/{library_id}`; DELETE `/api/libraries/{library_id}` |
| VIEW_AUDIT_LOGS | GET `/api/admin/audit-logs` |

## Tables
`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `audit_logs` (user/role changes).

## Change guide
- New permission: add a member to `PermissionName` in `backend/app/utils/enums.py`, add it to role defaults in `seed_roles` (`backend/app/api/setup.py`) and `backend/seed_rbac.py`, then guard routes with `Depends(require_permission(PermissionName.NEW))`.
- New role field: `backend/app/models/role.py`, `backend/app/schemas/role.py`, migration in `backend/alembic/versions/`, `frontend/lib/types/role.ts`, form in `frontend/app/admin/permissions/page.tsx`.
- New user admin action: handler in `backend/app/api/users.py` (log with `AuditLogService.log` + an `AuditAction` constant in `backend/app/utils/audit_actions.py`), method on `usersApi` in `frontend/lib/api/users.ts`, button in `frontend/app/admin/users/page.tsx`.

## Notes
- `ensure_permission` builds the set of permission names across all roles of the user; `is_superuser` short-circuits.
- `VIEW_LIBRARY` exists and is seeded but no route checks it; reads only require an authenticated active user.
- Frontend admin pages use `useRequireAdmin` (requires `is_superuser`), so a non-superuser holding `ACCESS_ADMIN` is redirected to `/` even though the API would allow them.
- `POST /api/users/` is open while the `users` table is empty (first user becomes active superuser); afterwards it requires `MANAGE_USERS`.
- User delete is soft (`users.deleted_at`, `BaseRepository.delete`); role delete is hard (no `deleted_at` column).
- `activate_user`, `deactivate_user`, `reset_password` and all `/permissions` writes do not write audit logs. Users/roles writes log via `AuditLogService.log`.
- Bug: `usersApi.resetPassword` posts `{new_password}` (frontend `PasswordResetRequest`), but the backend `PasswordResetRequest` (`backend/app/schemas/auth.py`) requires `password`, so `POST /api/users/{user_id}/reset-password` from the UI returns 422.
- `GET /api/users/` paginates with `skip`/`limit` (not `offset`); `usersApi.getAll(skip, limit)` matches.
- `PermissionName`/`RoleName` are not database enums: `permissions.name` and `roles.name` are plain strings.
