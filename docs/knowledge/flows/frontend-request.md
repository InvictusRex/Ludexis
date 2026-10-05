# Flow: Frontend request lifecycle

How a page call travels to the database and back. Example: `frontend/app/collections/[id]/page.tsx` loading a collection.

## 1. Page -> API module
```
frontend/app/collections/[id]/page.tsx   ("use client")
  const { user, loading } = useAuth()               frontend/contexts/auth-context.tsx
  useRequireAuth(user, loading)                     frontend/hooks/use-protected-route.ts (redirects to /auth/login)
  collectionsApi.getById(id)                        imported from "@/lib/api" (barrel frontend/lib/api.ts)
    -> frontend/lib/api/collections.ts
       apiClient.get<Collection>(`/collections/${id}`)
```
API modules export one object per resource (`archiveApi`, `collectionsApi`, `tagsApi`, ...) whose methods build the path (query strings via `URLSearchParams`) and call `apiClient`. Some methods do not hit a dedicated endpoint: `collectionsApi.getEntries`, `developersApi.getEntries`, `publishersApi.getEntries`, `franchisesApi.getEntries`, `tagsApi.getEntries` filter `archiveApi.getAll(0, 1000)` client side; `searchApi.search` fans out to six list calls; `adminApi.getRecentJobs` wraps `jobsApi.getAll`.

## 2. HTTP client (`frontend/lib/api/client.ts`)
```
apiClient.get | getList | post | patch | put | delete (endpoint, body?, auth?)
  -> request<T>() | requestList<T>()
     -> fetchWithAuth(endpoint, options, retried=false)
        url     = config.apiBaseUrl + endpoint        frontend/lib/config.ts
                  (NEXT_PUBLIC_API_URL, default "http://localhost:8000/api")
        headers = Content-Type: application/json
                  Authorization: Bearer <getAccessToken()>   unless auth === false
                  (credentials: "include" sends the httpOnly ludexis_access cookie; X-Requested-With: ludexis)
        body    = JSON.stringify(body)
        debugLog(...) when NEXT_PUBLIC_DEBUG === "1"
        401 && auth !== false && !retried
           -> refreshAccessToken() -> doRefresh(): POST {apiBaseUrl}/auth/refresh {refresh_token}
              ok   -> setTokens(...) ; fetchWithAuth(endpoint, options, true)
              fail -> clearTokens() (AuthProvider listener sets user = null)
        !response.ok
           -> message = detail (string) | detail[].msg joined by "; " | "HTTP <status>"
           -> throw new ApiError(message, status)              frontend/lib/errors.ts
     request:     204 -> undefined ; else response.json()
     requestList: { items: json, total: Number(X-Total-Count) or items.length }
```
Callers catch the error themselves: many use `toastError(err, "...")` (`frontend/lib/toast.ts`) or `getErrorMessage(err)` (`frontend/lib/errors.ts`); some only `console.error` (e.g. `frontend/app/collections/[id]/page.tsx`).
Exceptions to this path: `artworkApi.upload`/`replace` use their own `multipartRequest` fetch (no refresh, plain `Error`); `PrometheusMetricsPanel` fetches `/api/metrics` directly; `<img src={mediaUrl(...)}>` loads `/media/...` without auth headers.

## 3. Backend: router -> service -> repository -> DB
```
GET /api/collections/{collection_id}
  backend/main.py: CORSMiddleware (origins from CORS_ORIGINS, exposes X-Total-Count) ; app.include_router(api_router)
  backend/app/api/__init__.py: api_router = APIRouter(prefix=settings.API_PREFIX)  ("/api")
  backend/app/api/collections.py: router = APIRouter(prefix="/collections")
  -> read_collection(collection_id, current_user=Depends(get_current_active_user), db=Depends(get_db))
       get_db()              backend/app/db/session.py   SessionLocal() per request, closed in finally
       get_current_active_user -> get_current_user -> verify_token -> UserRepository.get   (401 on failure)
     -> CollectionService.get(db, collection_id)                 backend/app/services/collection.py
        -> CollectionRepository.get_active(db, collection_id)    backend/app/repositories/collection.py
           db.query(Collection).filter(id == ..., deleted_at IS NULL).one_or_none()
     -> None -> HTTPException(404, "Collection not found")
  <- response_model=CollectionRead (Pydantic from_attributes; entry_ids from Collection.entry_ids)
```
Writes follow the same shape with `Depends(require_permission(PermissionName.X))`, a service call that raises `ValueError` for validation (mapped to 400 by the router), repository `create/update/delete` (each commits), and an audit row (`AuditService.record` or `AuditLogService.log`).

## 4. Layer bypasses to know about
| Router | Bypasses the service layer with |
|---|---|
| `backend/app/api/users.py` | `UserRepository`, `RoleRepository` (no service) |
| `backend/app/api/roles.py`, `backend/app/api/permissions.py` | `RoleRepository`, `PermissionRepository` |
| `backend/app/api/setup.py` | `UserRepository` plus raw `db.query(Permission/Role)` in `seed_permissions`/`seed_roles` |
| `backend/app/api/auth.py` | `RefreshTokenRepository` (besides `AuthService`) |
| `backend/app/api/scan.py` | `JobHistoryRepository.count_by_status` |
| `backend/app/api/admin.py` | `RoleRepository.list_items` |
| `backend/app/api/archive_entries.py` | `ScreenshotRepository.list_by_entry`, `ScannerService.find_duplicates` |
| `backend/app/api/health.py` | raw `SELECT 1` and `Redis.from_url(...).ping()` |

## Entities
`page:/collections/[id]`, `ctx:contexts/auth-context`, `hook:hooks/use-protected-route`, `lib:lib/api`, `apimod:lib/api/collections`, `apifn:lib/api/collections.collectionsApi.getById`, `apimod:lib/api/client`, `lib:lib/config`, `lib:lib/errors`, `lib:lib/auth/session`, `router:app.api.collections`, `service:app.services.collection.CollectionService`, `repo:app.repositories.collection.CollectionRepository`, `module:app.db.session`, `module:app.core.auth`, `table:collections`.
