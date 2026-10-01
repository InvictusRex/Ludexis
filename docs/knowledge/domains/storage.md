# Domain: Storage

Local filesystem storage for artwork, rooted at `settings.ARTWORK_STORAGE_PATH` (default `./artwork`), and the authenticated `/media` file route that serves it.

## Files
| File | Role | Key symbols |
|---|---|---|
| `backend/app/services/storage.py` | Service | `StorageService.save`, `delete`, `exists`, `absolute_path`, `base_dir` |
| `backend/main.py` | `/media` route (`media_router`) | `read_media`, `get_media_user`, `media_dir` |
| `backend/app/core/config.py` | Settings | `ARTWORK_STORAGE_PATH` |
| `backend/app/services/artwork.py` | Main consumer | `ArtworkService` (`self.storage`) |
| `backend/scripts/seed_demo.py` | Demo seeding writes artwork files | `write_artwork`, `make_png` |
| `frontend/lib/media.ts` | URL builder | `mediaUrl` |
| `frontend/lib/config.ts` | Base URLs | `config.mediaBaseUrl` (`NEXT_PUBLIC_MEDIA_URL`, default `http://localhost:8000/media`) |

## Graph IDs
| Type | ID |
|---|---|
| Service | `service:app.services.storage.StorageService` |
| Router | `router:main` |
| Module | `module:main`, `module:app.core.config`, `module:scripts.seed_demo` |
| LibUtil | `lib:lib/media`, `lib:lib/config` |

## API Endpoints
| Method | Full path | Handler | Permission | Frontend caller |
|---|---|---|---|---|
| GET | `/media/{path:path}` | `read_media` (`backend/main.py`) | authenticated (Bearer or `?media_token=`) | `<img>` URLs from `mediaUrl()` |

## Tables
None. Paths stored in `archive_entries.cover_path`/`banner_path`/`logo_path` and `screenshots.file_path` are relative to `ARTWORK_STORAGE_PATH`.

## Change guide
- Move to object storage: keep the `StorageService` interface (`save`, `delete`, `exists`, `absolute_path`) and replace its body; `read_media` in `backend/main.py` and `ArtworkService._file_sha256` / `validate_all_artwork` use `absolute_path`/`base_dir` and would need a streaming alternative.
- Change the media base URL: `NEXT_PUBLIC_MEDIA_URL` (read in `frontend/lib/config.ts`).

## Notes
- `StorageService.__init__` creates `base_dir` if missing; `backend/main.py` also creates it at import time.
- `read_media` resolves the requested path and returns 404 if it escapes `media_dir` or is not a file (path traversal guard).
- `/media/{path:path}` requires an active user via `get_media_user` (`backend/main.py`): a Bearer header, or a media token as `?media_token=` because `<img>` cannot send headers. Media tokens come from `GET /api/auth/media-token` (`create_media_token`, type "media", `MEDIA_TOKEN_EXPIRE_MINUTES` = 60) and are rejected by every API route; access tokens are rejected in URLs. `mediaUrl()` in `frontend/lib/media.ts` appends the token stored by `AuthContext.renewMediaToken` (renewed within 5 minutes of expiry).
- `/media` is mounted outside `settings.API_PREFIX`, so the full URL has no `/api` prefix.
