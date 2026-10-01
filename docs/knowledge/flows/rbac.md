# Flow: RBAC enforcement and administration

How a permission check runs on every protected route, and how users/roles are managed. Domain doc: `docs/knowledge/domains/rbac.md`.

## 1. Permission check (every protected route)
```
@router.<method>(..., current_user=Depends(require_permission(PermissionName.X)))
  -> require_permission(permission) returns permission_dependency      backend/app/core/auth.py
     -> get_current_active_user -> get_current_user(token, db)
        -> verify_token(token, token_type="access")                     401 on JWTError
        -> UserRepository.get(db, subject)                               401 if missing/inactive
     -> ensure_permission(current_user, permission)
        role_permissions = {perm.name for role in user.roles for perm in role.permissions}
        permission.value not in role_permissions and not user.is_superuser -> 403 "Permission denied"
```
Read-only routes use `Depends(get_current_active_user)` (any authenticated active user). `VIEW_LIBRARY` is never checked.

## 2. Permission map (from route decorators)
| Permission | Enforced on |
|---|---|
| VIEW_LIBRARY | not enforced by any route |
| EDIT_METADATA | POST `/api/archive-entries/`; PATCH `/api/archive-entries/{archive_entry_id}`; PATCH `/api/archive-entries/{archive_entry_id}/metadata`; DELETE `/api/archive-entries/{archive_entry_id}`; POST `/api/artwork/upload`; PATCH `/api/artwork/replace`; DELETE `/api/artwork/{artwork_id}`; POST `/api/artwork/auto-download`; POST `/api/developers/`; PATCH `/api/developers/{developer_id}`; DELETE `/api/developers/{developer_id}`; POST `/api/franchises/`; PATCH `/api/franchises/{franchise_id}`; DELETE `/api/franchises/{franchise_id}`; POST `/api/publishers/`; PATCH `/api/publishers/{publisher_id}`; DELETE `/api/publishers/{publisher_id}`; POST `/api/tags/`; PATCH `/api/tags/{tag_id}`; DELETE `/api/tags/{tag_id}` |
| MANAGE_COLLECTIONS | POST `/api/collections/`; PATCH `/api/collections/{collection_id}`; DELETE `/api/collections/{collection_id}`; POST `/api/collections/{collection_id}/entries`; DELETE `/api/collections/{collection_id}/entries/{entry_id}` |
| MANAGE_USERS | GET `/api/permissions/`; POST `/api/permissions/`; GET `/api/permissions/{permission_id}`; GET `/api/roles/`; POST `/api/roles/`; GET `/api/roles/{role_id}`; PATCH `/api/roles/{role_id}`; DELETE `/api/roles/{role_id}`; GET `/api/users/`; GET `/api/users/{user_id}`; PATCH `/api/users/{user_id}`; DELETE `/api/users/{user_id}`; POST `/api/users/{user_id}/activate`; POST `/api/users/{user_id}/deactivate`; POST `/api/users/{user_id}/reset-password`; POST `/api/users/` (via `_require_manage_users_if_initialized`) |
| RUN_SCANS | POST `/api/jobs/start`; POST `/api/jobs/{job_id}/cancel`; POST `/api/scan/full`; POST `/api/scan/incremental` |
| ACCESS_ADMIN | GET `/api/admin/stats`; GET `/api/admin/permission-report`; GET `/api/job-monitor/workers`; GET `/api/job-monitor/stats`; POST `/api/libraries/`; PATCH `/api/libraries/{library_id}`; DELETE `/api/libraries/{library_id}` |
| VIEW_AUDIT_LOGS | GET `/api/admin/audit-logs` |

## 3. Seeded roles
`seed_roles` in `backend/app/api/setup.py` and `backend/seed_rbac.py` define the same defaults:

| Role (`RoleName`) | Permissions |
|---|---|
| Administrator | all 7 `PermissionName` values |
| Moderator | VIEW_LIBRARY, EDIT_METADATA, MANAGE_COLLECTIONS, RUN_SCANS |
| User | VIEW_LIBRARY |
| ReadOnly | VIEW_LIBRARY |

## 4. Create user
```
frontend/app/admin/users/page.tsx -> usersApi.create(data)       frontend/lib/api/users.ts
  POST /api/users/
  -> create_user(data: UserCreate, current_user=Depends(_require_manage_users_if_initialized))   backend/app/api/users.py
     _require_manage_users_if_initialized: UserRepository.has_any(db) false -> allow anonymous;
                                           else get_optional_current_user + ensure_permission(MANAGE_USERS)
     -> UserRepository.get_by_username / get_by_email      400 on conflict
     -> hash_password(data.password)                       backend/app/core/security.py
     -> UserRepository.create(db, {...})                   first user forced active + superuser
     -> only if users already existed and data.role_ids:
        _load_roles(db, data.role_ids) -> RoleRepository.get per id (404 if missing); commit
     -> AuditService.log(action=CREATE_USER) ; AuditService.log(action=ASSIGN_ROLE) per role
  <- UserRead
```

## 5. Update user / change roles
```
usersApi.update(id, data)  PATCH /api/users/{user_id}   (MANAGE_USERS)
  -> update_user(user_id, data: UserUpdate, ...)
     -> _get_user_or_404 -> UserRepository.get_active(db, user_id)
     -> uniqueness checks via UserRepository.get_by_username / get_by_email
     -> data.role_ids is not None -> _load_roles ; diff old/new roles
     -> commit ; AuditService.log(UPDATE_USER) + ASSIGN_ROLE / REMOVE_ROLE per changed role
usersApi.activate / deactivate  POST /api/users/{user_id}/activate | /deactivate
  -> UserRepository.activate / deactivate   (400 when targeting yourself; no audit)
usersApi.resetPassword  POST /api/users/{user_id}/reset-password  -> hash_password ; commit (no audit)
                              (body {password})
usersApi.remove  DELETE /api/users/{user_id}  -> UserRepository.delete (soft, deleted_at) ; AuditService.log(DELETE_USER)
```

## 6. Roles and permissions
```
frontend/app/admin/permissions/page.tsx
  -> rolesApi.getAll()        GET /api/roles/            -> RoleRepository.list_items(db)
  -> permissionsApi.getAll()  GET /api/permissions/      -> PermissionRepository.list_items(db)
  -> adminApi.getPermissionReport()  GET /api/admin/permission-report (ACCESS_ADMIN)
                              -> RoleRepository.list_items -> {role.name: [permission.name]}
  -> rolesApi.create(data)    POST /api/roles/           -> RoleRepository.create ; _load_permissions ; AuditService.log(CREATE_ROLE)
  -> rolesApi.remove(id)      DELETE /api/roles/{role_id} -> RoleRepository.delete (hard) ; AuditService.log(DELETE_ROLE)
rolesApi.update(id, data)     PATCH /api/roles/{role_id}  -> set name/description/permissions ; AuditService.log(UPDATE_ROLE)
                              (no frontend caller)
permissionsApi.create         POST /api/permissions/     -> PermissionRepository.get_by_name (400 if exists) ; PermissionRepository.create
                              (no frontend caller; no audit)
```
All `/api/users/*` (except `POST /api/users/`), `/api/roles/*`, `/api/permissions/*` require `MANAGE_USERS`.

## 7. Frontend gating
- `useRequireAdmin` (all `/admin/*` pages) requires `user.is_superuser`; it does not look at permissions.
- `EffectivePermissionsPanel` (`frontend/components/common/effective-permissions-panel.tsx`) calls `adminApi.getPermissionReport`, which needs `ACCESS_ADMIN`; it renders on `frontend/app/account/page.tsx` for every user.

## Entities
`module:app.core.auth`, `router:app.api.users`, `router:app.api.roles`, `router:app.api.permissions`, `router:app.api.admin`, `repo:app.repositories.user.UserRepository`, `repo:app.repositories.role.RoleRepository`, `repo:app.repositories.permission.PermissionRepository`, `service:app.services.audit.AuditService`, `table:users`, `table:roles`, `table:permissions`, `table:user_roles`, `table:role_permissions`, `page:/admin/users`, `page:/admin/permissions`, `apimod:lib/api/users`, `apimod:lib/api/roles`, `apimod:lib/api/permissions`.
