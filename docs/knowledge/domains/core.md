# Domain: Core

## Overview
Core infrastructure — base classes, configuration, database session management, and shared utilities.

## Key Entities
| Type | ID | Name |
|------|-----|------|
| Repository | `repo:app.repositories.base.BaseRepository` | BaseRepository |
| Schema | `schema:app.schemas.base.TimestampedModel` | TimestampedModel |

## Components
| Component | Path | Description |
|-----------|------|-------------|
| Config | `backend/app/core/config.py` | Pydantic Settings, env vars |
| Auth | `backend/app/core/auth.py` | JWT utilities, password hashing |
| Security | `backend/app/core/security.py` | Token creation/verification |
| Dependencies | `backend/app/core/dependencies.py` | FastAPI dependency injection |
| Logging | `backend/app/core/logging.py` | Structured logging setup |
| Metrics | `backend/app/core/metrics.py` | Prometheus metrics |
| DB Base | `backend/app/db/base.py` | SQLAlchemy declarative base |
| DB Session | `backend/app/db/session.py` | Async session factory |

## Notes
- BaseRepository provides generic CRUD for all repositories
- All models inherit from `app.db.base.Base`
- All schemas use `TimestampedModel` as common base
- Configuration via `.env` files with Pydantic validation
