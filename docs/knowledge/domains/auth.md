# Domain: Auth

## Overview
Authentication and session management — login, logout, token refresh, JWT handling, and user session lifecycle.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Service | `service:app.services.auth.AuthService` | AuthService |
| Repository | `repo:app.repositories.user.UserRepository` | UserRepository |
| Repository | `repo:app.repositories.refresh_token.RefreshTokenRepository` | RefreshTokenRepository |
| Model | `model:app.models.user.User` | User |
| Model | `model:app.models.refresh_token.RefreshToken` | RefreshToken |
| Schema | `schema:app.schemas.auth.Token` | Token |
| Schema | `schema:app.schemas.auth.LoginRequest` | LoginRequest |

## Related Tables
- `users` — user accounts
- `refresh_tokens` — JWT refresh tokens

## Dependencies
- **Depends on**: UserRepository, RefreshTokenRepository
- **Depended by**: All authenticated API endpoints (via FastAPI dependencies)

## API Endpoints
- `POST /auth/login` — user login
- `POST /auth/refresh` — refresh access token
- `POST /auth/logout` — revoke refresh token
- `GET /auth/me` — current user info
- `POST /auth/token` — OAuth2 compatible token login

## Notes
- Uses `python-jose` for JWT encoding/decoding
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored in DB
- Password hashing via `passlib` with bcrypt
