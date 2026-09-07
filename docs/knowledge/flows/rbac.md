# Flow: RBAC Enforcement

## Overview
Role-Based Access Control — how permissions are checked on API endpoints.

## Permission Check Flow
```
1. Client sends request with Authorization: Bearer <token>
   -> FastAPI dependency chain:
     -> get_current_user(token)
       -> decode_access_token(token) -> user_id
       -> UserRepository.get_by_id(user_id)
       -> check is_active
     -> require_permission("EDIT_METADATA")
       -> user = get_current_user()
       -> for role in user.roles:
         -> for permission in role.permissions:
           -> if permission.name == "EDIT_METADATA":
             -> return (authorized)
       -> raise HTTPException(403)
   -> endpoint function executes
```

## Permission Assignment
```
POST /roles/ {name, description, permission_ids}
  -> create role
  -> RoleRepository.create({name, description})
  -> for each permission_id:
    -> add to role_permissions junction

POST /users/ {username, email, password, role_ids}
  -> create user
  -> UserRepository.create({...})
  -> for each role_id:
    -> add to user_roles junction
```

## Permission Report
```
GET /admin/permission-report
  -> RoleRepository.list_all()
  -> for each role:
    -> role.permissions -> list of permission names
  <- [{role: "admin", permissions: ["MANAGE_USERS", "EDIT_METADATA", ...]}]
```

## Required Permissions by Endpoint
| Endpoint | Permission |
|----------|------------|
| `GET/POST/PATCH/DELETE /users/*` | `MANAGE_USERS` |
| `GET/POST/PATCH/DELETE /roles/*` | `MANAGE_USERS` |
| `GET/POST /permissions/*` | `MANAGE_USERS` |
| `POST /archive-entries/` | `EDIT_METADATA` |
| `PATCH /archive-entries/*` | `EDIT_METADATA` |
| `DELETE /archive-entities/*` | `EDIT_METADATA` |
| `POST /artwork/*` | `EDIT_METADATA` |
| `POST /scan/*` | `RUN_SCANS` |
| `POST /jobs/start` | `RUN_SCANS` |
| `GET /admin/stats` | `ACCESS_ADMIN` |
| `GET /admin/permission-report` | `ACCESS_ADMIN` |
| `GET /admin/audit-logs` | `VIEW_AUDIT_LOGS` |
| `GET /job-monitor/*` | `ACCESS_ADMIN` |

## Entities Involved
- `model:app.models.role.Role`
- `model:app.models.permission.Permission`
- `repo:app.repositories.role.RoleRepository`
- `repo:app.repositories.permission.PermissionRepository`
- `core:app.core.dependencies` (require_permission)
- `core:app.core.auth` (get_current_user)
