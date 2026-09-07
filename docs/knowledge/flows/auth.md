# Flow: Authentication

## Overview
User login, token management, and session lifecycle.

## Sequence
```
1. POST /auth/login {username, password}
   -> AuthService.authenticate(username, password)
     -> UserRepository.get_by_username(username)
     -> verify_password(plain, hashed)
     -> AuthService.create_tokens(user)
       -> create_access_token(user.id)
       -> create_refresh_token(user.id)
         -> RefreshTokenRepository.create(token)
     -> AuditService.record("user.login", user.id)
   <- Token {access_token, refresh_token, token_type}

2. POST /auth/refresh {refresh_token}
   -> AuthService.refresh_tokens(refresh_token)
     -> RefreshTokenRepository.get_by_token(refresh_token)
     -> verify not expired, not revoked
     -> create_access_token(user.id)
     -> AuditService.record("user.refresh", user.id)
   <- Token {access_token, refresh_token, token_type}

3. POST /auth/logout {refresh_token}
   -> AuthService.logout(refresh_token)
     -> RefreshTokenRepository.get_by_token(refresh_token)
     -> mark revoked=True
     -> AuditService.record("user.logout", user.id)
   <- 204 No Content

4. GET /auth/me (requires auth)
   -> extract_user_from_token()
     -> decode_access_token()
     -> UserRepository.get_by_id(user_id)
   <- UserRead {id, username, email, roles}
```

## Token Lifecycle
- Access token: 15min expiry, contains `sub` (user_id) and `type=access`
- Refresh token: 7day expiry, stored in DB, can be revoked
- Password hashing: bcrypt via passlib

## Entities Involved
- `service:app.services.auth.AuthService`
- `repo:app.repositories.user.UserRepository`
- `repo:app.repositories.refresh_token.RefreshTokenRepository`
- `model:app.models.user.User`
- `model:app.models.refresh_token.RefreshToken`
- `service:app.services.audit.AuditService`
