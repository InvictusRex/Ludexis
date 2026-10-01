# Flow: Authentication

Login, session bootstrap, authenticated requests, silent refresh on 401, and logout. Domain doc: `docs/knowledge/domains/auth.md`.

## 1. Login
```
frontend/app/auth/login/page.tsx  (form submit)
  -> useAuth().login(username, password)                      frontend/contexts/auth-context.tsx
     -> authApi.login({username, password})                    frontend/lib/api/auth.ts
        -> apiClient.post("/auth/login", body, false)          auth=false: no Bearer header, no refresh retry
           POST /api/auth/login
           -> login(data: LoginRequest, db)                    backend/app/api/auth.py
              -> AuthService.authenticate(db, username, password)   backend/app/services/auth.py
                 -> UserRepository.get_by_username(db, username)    (filters deleted_at IS NULL)
                 -> verify_password(password, user.hashed_password) backend/app/core/security.py (bcrypt)
                 -> auth_login_success_total / auth_login_failure_total .inc()
              -> fail: AuditService.log(db, action=LOGIN_FAILURE, entity="User") ; 401
              -> inactive: 400 "Inactive user"
              -> AuthService.create_tokens(db, user)
                 -> create_access_token(subject=user.id)      15 min, type="access"
                 -> create_refresh_token(subject=user.id)     30 days, type="refresh"
                 -> RefreshTokenRepository.create(db, {token, user_id, expires_at})   INSERT refresh_tokens
              -> AuditService.log(db, action=LOGIN_SUCCESS, entity="User", user_id=...)
           <- Token {access_token, refresh_token, token_type: "bearer"}
     -> setTokens(access, refresh)                            frontend/lib/auth/token-store.ts (localStorage)
     -> getTokenExpiry(token) for both                         frontend/lib/auth/token-expiry.ts
     -> authApi.getCurrentUser()  -> GET /api/auth/me
        -> read_current_user(current_user=Depends(get_current_user))   backend/app/api/auth.py
           -> get_current_user(token, db)                     backend/app/core/auth.py
              -> verify_token(token, token_type="access")      JWTError -> 401
              -> UserRepository.get(db, subject)               missing or inactive -> 401
        <- UserRead
     -> setUser(user)
  -> router.push("/")
```
`POST /api/auth/token` (`token_login`) is the same logic for OAuth2 form data (used by `oauth2_scheme`, not by the frontend).

## 2. Session bootstrap (page load)
```
frontend/app/layout.tsx renders AuthProvider
  -> AuthProvider useEffect -> initializeAuth()
     -> getAccessToken() / getRefreshToken()     missing -> loading=false, user=null
     -> authApi.getCurrentUser()  GET /api/auth/me  (401 triggers the refresh in step 4)
     -> error -> clearTokens()
  -> every 30 s (SESSION_CHECK_INTERVAL_MS): warn when access token expires within 5 min;
     both tokens expired -> logout()
Protected pages: useRequireAuth(user, loading) -> router.push("/auth/login") when user is null
Admin pages:     useRequireAdmin(user, loading) -> also router.push("/") when !user.is_superuser
                 (frontend/hooks/use-protected-route.ts)
```

## 3. Authenticated request
```
<resource>Api.<method>() (e.g. collectionsApi.getById) -> apiClient.get/post/... (frontend/lib/api/client.ts)
  -> fetchWithAuth(endpoint): Authorization: Bearer <getAccessToken()>
  -> backend route Depends(get_current_active_user) or Depends(require_permission(PermissionName.X))
     -> get_current_user -> verify_token -> UserRepository.get
     -> ensure_permission(user, permission)   403 unless role grants it or is_superuser
```

## 4. Silent refresh on 401
```
fetchWithAuth sees 401 (auth !== false, not yet retried)
  -> refreshAccessToken()            single shared promise for concurrent 401s
     -> doRefresh(): fetch POST {apiBaseUrl}/auth/refresh {refresh_token}
        POST /api/auth/refresh
        -> refresh(data: RefreshRequest, db)                   backend/app/api/auth.py
           -> AuthService.refresh_tokens(db, refresh_token)
              -> verify_token(refresh_token, token_type="refresh")
              -> RefreshTokenRepository.get_by_token(db, token)   missing or revoked -> JWTError -> 401
              -> UserRepository.get(db, subject)
              -> token_record.revoked = True; commit             (rotation)
              -> AuthService.create_tokens(db, user)             new pair, INSERT refresh_tokens
           -> RefreshTokenRepository.get_by_token(...) -> AuditService.log(action=TOKEN_REFRESH)
        <- Token
     -> ok: setTokens(new access, new refresh) ; retry original request once
     -> fail: clearTokens() -> onTokensCleared listeners -> AuthProvider sets user=null
```

## 5. Logout
```
frontend/components/layout/header.tsx -> useAuth().logout()
  -> authApi.logout({refresh_token})  POST /api/auth/logout (auth=false)
     -> logout(data: LogoutRequest, db)                         backend/app/api/auth.py
        -> RefreshTokenRepository.get_by_token(db, token)
        -> AuthService.logout(db, token)   sets revoked=True
        -> AuditService.log(action=LOGOUT) only if the token existed and was not already revoked
     <- 204
  -> clearTokens(); user=null   (errors from the request are ignored)
```

## 6. First-run setup (backend only)
```
GET /api/setup/status  -> setup_status()       -> UserRepository.has_any(db) -> {initialized}
POST /api/setup/initialize (UserCreate)
  -> initialize_system(data, db)               backend/app/api/setup.py
     -> UserRepository.has_any -> 409 if true
     -> UserRepository.get_by_username / get_by_email -> 400 on conflict
     -> seed_permissions(db) ; seed_roles(db, permissions)
     -> hash_password ; UserRepository.create(... is_superuser=True) ; append Administrator role
```
The frontend setup page (`frontend/app/auth/setup/page.tsx`) does not call these endpoints; `setupApi` is unused.

## Entities
`router:app.api.auth`, `router:app.api.setup`, `service:app.services.auth.AuthService`, `service:app.services.audit.AuditService`, `repo:app.repositories.user.UserRepository`, `repo:app.repositories.refresh_token.RefreshTokenRepository`, `module:app.core.security`, `module:app.core.auth`, `table:users`, `table:refresh_tokens`, `table:audit_logs`, `ctx:contexts/auth-context`, `hook:hooks/use-protected-route`, `apimod:lib/api/auth`, `apimod:lib/api/client`, `lib:lib/auth/token-store`, `lib:lib/auth/token-expiry`, `page:/auth/login`.
