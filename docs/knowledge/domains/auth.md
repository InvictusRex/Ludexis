# Domain: Auth

Username/password login, JWT access + refresh tokens (refresh tokens persisted and rotated), current-user lookup, and first-run system initialization. Frontend keeps tokens in `localStorage` and exposes session state through `AuthProvider`.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/api/auth.py` | Router `/auth` | `login`, `refresh`, `logout`, `read_current_user`, `token_login` |
| `backend/app/api/setup.py` | Router `/setup` (first run) | `setup_status`, `initialize_system`, `seed_permissions`, `seed_roles` |
| `backend/app/services/auth.py` | Service | `AuthService.authenticate`, `create_tokens`, `refresh_tokens`, `logout` |
| `backend/app/core/security.py` | JWT + bcrypt helpers | `create_access_token`, `create_refresh_token`, `verify_token`, `hash_password`, `verify_password` |
| `backend/app/core/auth.py` | FastAPI auth dependencies | `oauth2_scheme`, `get_current_user`, `get_optional_current_user`, `get_current_active_user` |
| `backend/app/repositories/refresh_token.py` | Repository | `RefreshTokenRepository.get_by_token` |
| `backend/app/repositories/user.py` | Repository (shared with rbac) | `UserRepository.get_by_username`, `has_any`, `get_by_email` |
| `backend/app/models/refresh_token.py` | Model | `RefreshToken` |
| `backend/app/models/user.py` | Model | `User` |
| `backend/app/schemas/auth.py` | Schemas | `LoginRequest`, `Token`, `RefreshRequest`, `LogoutRequest`, `TokenPayload`, `PasswordResetRequest` |
| `backend/app/core/config.py` | Settings | `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` |
| `frontend/contexts/auth-context.tsx` | Session context | `AuthProvider`, `useAuth` (value: `user`, `loading`, `login`, `logout`) |
| `frontend/hooks/use-protected-route.ts` | Route guards | `useRequireAuth`, `useRequireAdmin` |
| `frontend/lib/auth/session.ts` | session-ended events (tokens live in httpOnly cookies) | `endSession`, `onSessionEnded` |
| `backend/app/core/rate_limit.py` | failed-login limiter | `LoginRateLimiter` |
| `frontend/lib/api/auth.ts` | API module | `authApi.login`, `refresh`, `logout`, `getCurrentUser` |
| `frontend/lib/api/setup.ts` | API module | `setupApi.getStatus`, `initialize` |
| `frontend/lib/api/client.ts` | HTTP client (401 refresh) | `apiClient`, `doRefresh`, `refreshAccessToken` |
| `frontend/lib/types/auth.ts` | Types | `LoginRequest`, `TokenResponse`, `RefreshRequest`, `LogoutRequest` |
| `frontend/lib/types/setup.ts` | Types | `SetupStatus` |
| `frontend/app/auth/login/page.tsx` | Login page | calls `useAuth().login` |
| `frontend/app/auth/setup/page.tsx` | Setup page (stub, see Notes) | none |
| `frontend/app/account/page.tsx` | Account page | renders `AccountActivityList`, `EffectivePermissionsPanel` |
| `backend/tests/test_auth.py`, `backend/tests/test_token_expiration.py` | Backend tests | |
| `frontend/app/auth/login/page.test.tsx`, `frontend/e2e/tasks.spec.ts`, `backend/tests/test_cookie_auth.py`, `frontend/hooks/use-protected-route.test.ts`, `frontend/lib/api/client.test.ts`, `frontend/e2e/auth.spec.ts` | Frontend tests | |

## Graph IDs
| Type | ID |
|---|---|
| Router | `router:app.api.auth`, `router:app.api.setup` |
| Service | `service:app.services.auth.AuthService` |
| Repository | `repo:app.repositories.refresh_token.RefreshTokenRepository`, `repo:app.repositories.user.UserRepository` |
| Model | `model:app.models.refresh_token.RefreshToken`, `model:app.models.user.User` |
| Schema | `schema:app.schemas.auth.LoginRequest`, `schema:app.schemas.auth.Token`, `schema:app.schemas.auth.RefreshRequest`, `schema:app.schemas.auth.LogoutRequest` |
| Module | `module:app.core.security`, `module:app.core.auth` |
| Table | `table:users`, `table:refresh_tokens` |
| Page | `page:/auth/login`, `page:/auth/setup`, `page:/account` |
| Context | `ctx:contexts/auth-context` |
| Hook | `hook:hooks/use-protected-route` |
| ApiModule | `apimod:lib/api/auth`, `apimod:lib/api/setup`, `apimod:lib/api/client` |
| LibUtil | `lib:lib/auth/session` |
| Module | `module:app.core.rate_limit` |
| TypeModule | `typemod:lib/types/auth`, `typemod:lib/types/setup` |
| TestFile | `test:backend/tests/test_auth.py`, `test:backend/tests/test_token_expiration.py`, `test:frontend/e2e/auth.spec.ts`, `test:frontend/app/auth/login/page.test.tsx` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| POST | `/api/auth/login` | `login` (`backend/app/api/auth.py`) | public | `apifn:lib/api/auth.authApi.login` |
| POST | `/api/auth/refresh` | `refresh` (`backend/app/api/auth.py`) | public | `apifn:lib/api/auth.authApi.refresh` |
| POST | `/api/auth/logout` | `logout` (`backend/app/api/auth.py`) | public | `apifn:lib/api/auth.authApi.logout` |
| GET | `/api/auth/me` | `read_current_user` (`backend/app/api/auth.py`) | authenticated (get_current_user) | `apifn:lib/api/auth.authApi.getCurrentUser` |
| POST | `/api/auth/change-password` | `change_password` (`backend/app/api/auth.py`) | authenticated | `apifn:lib/api/auth.authApi.changePassword` |
| POST | `/api/auth/logout-all` | `logout_all` (`backend/app/api/auth.py`) | authenticated | `apifn:lib/api/auth.authApi.logoutAll` |
| POST | `/api/auth/token` | `token_login` (`backend/app/api/auth.py`) | public | none |
| GET | `/api/setup/status` | `setup_status` (`backend/app/api/setup.py`) | public | `apifn:lib/api/setup.setupApi.getStatus` |
| POST | `/api/setup/initialize` | `initialize_system` (`backend/app/api/setup.py`) | public | `apifn:lib/api/setup.setupApi.initialize` |

## Tables
`users` (read), `refresh_tokens` (insert on issue, `revoked` flag on rotate/logout), `audit_logs` (login/refresh/logout events), `permissions`, `roles`, `role_permissions`, `user_roles` (seeded by `POST /api/setup/initialize`).

## Change guide
- New token claim: `backend/app/core/security.py` (`create_access_token`), read it in `backend/app/core/auth.py`; the browser never reads tokens (httpOnly cookies).
- New field on login/refresh response: `backend/app/schemas/auth.py` (`Token`), the return dicts in `backend/app/api/auth.py`, `frontend/lib/types/auth.ts` (`TokenResponse`), consumer `frontend/contexts/auth-context.tsx`.
- New `User` column: `backend/app/models/user.py`, `backend/app/schemas/user.py` (`UserRead`), a migration in `backend/alembic/versions/`, `frontend/lib/types/user.ts` (`User`).
- Change token lifetimes: `backend/app/core/config.py` (`ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`); the frontend warning window is `SESSION_WARNING_WINDOW_MS` in `frontend/contexts/auth-context.tsx`.
- Protect a new page: call `useRequireAuth(user, loading)` or `useRequireAdmin(user, loading)` from `frontend/hooks/use-protected-route.ts` with `useAuth()` values.

## Notes
- Access token 15 min, refresh token 30 days (defaults in `Settings`). JWT payload: `sub` (user id), `type` (`access`/`refresh`), `exp`, `jti`; access tokens also carry a fractional `iat`.
- `AuthService.refresh_tokens` revokes the presented refresh token and issues a new pair (rotation). Reusing a revoked token returns 401.
- `POST /api/auth/token` is the OAuth2 form endpoint used by `oauth2_scheme` (`tokenUrl="/api/auth/token"`); the frontend uses `POST /api/auth/login` (JSON).
- `get_current_user` rejects inactive users with 401; `login` returns 400 for inactive users after a correct password.
- `frontend/app/auth/setup/page.tsx` redirects to `/auth/login` when `setupApi.getStatus` reports `initialized`; its last step calls `setupApi.initialize`, then `AuthContext.login`, then `librariesApi.create`, and does not re-initialize on retry after a failed library step. `authApi.refresh` is not called anywhere (the client refreshes with its own `fetch` in `doRefresh`).
- `POST /api/setup/initialize` returns 409 once any user exists; it seeds the 7 permissions and 4 roles (`RoleName`) and makes the user a superuser with the Administrator role.
- `useRequireAdmin` checks `user.is_superuser`, not permissions.
- Browser sessions use httpOnly cookies set by `POST /api/auth/login` and `/auth/refresh` (`set_auth_cookies` in `backend/app/core/auth.py`): `ludexis_access` (path `/`, access lifetime) and `ludexis_refresh` (path `/api/auth`, refresh lifetime), `SameSite=Lax`, `Secure` over HTTPS. `get_current_user` accepts the Authorization header first, then the cookie; cookie-authenticated POST/PUT/PATCH/DELETE must send `X-Requested-With` (`require_csrf_header`), which `apiClient` always sends.
- A cookie refresh (no body) renews the cookies and returns no tokens in the body; `/auth/token` and body refreshes still return tokens for tooling. `/auth/logout` revokes the body or cookie refresh token and clears both cookies.
- `LoginRateLimiter` (Redis key `login-failures:<username>:<ip>`): 5 failures within 15 minutes return 429 with `Retry-After`, even for the right password; a success clears the counter; if Redis is down logins are not limited.
- Ending sessions (`AuthService.end_sessions`): sets `users.sessions_revoked_at` and revokes every refresh token of the user; `_user_from_token` rejects access tokens whose `iat` is older (401 "Session ended"), so stolen access tokens stop working at once instead of after 15 minutes.
- `POST /api/auth/change-password` checks the current password (failures count against the login rate limiter for that username and address), requires 8+ characters, ends every session, then issues new tokens and cookies for the caller (tokens in the body only for Authorization-header callers). `POST /api/auth/logout-all` ends every session including the caller's and clears the cookies. Both are on the account page (`AccountSecurityCard`).
