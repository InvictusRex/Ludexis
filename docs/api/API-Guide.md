# Ludexis Backend API Guide

**Version:** 0.1.0
**Base URL:** `/api`
**Authentication:** JWT Bearer Token
**API Style:** REST

---

# Overview

The Ludexis Backend API provides a complete interface for managing game archives, metadata, artwork, collections, users, permissions, scanning operations, and administrative functions.

All endpoints return JSON unless otherwise specified.

Protected endpoints require a valid JWT access token.

---

# Authentication

Ludexis uses JWT Bearer authentication.

## Login

Authenticate using username and password.

**Endpoint**

```http
POST /api/auth/login
```

**Request**

```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**Response**

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<jwt>",
  "token_type": "bearer",
  "expires_in": 900,
  "refresh_expires_in": 2592000
}
```

The response also sets the httpOnly session cookies `ludexis_access` and `ludexis_refresh` used by the web app. Five failed attempts for one username from one address within 15 minutes return `429 Too Many Requests` with a `Retry-After` header.

---

## OAuth2 Login

Used by Swagger UI and OAuth2-compatible clients.

```http
POST /api/auth/token
```

Content type:

```text
application/x-www-form-urlencoded
```

Parameters:

| Field    | Type   |
| -------- | ------ |
| username | string |
| password | string |

---

## Refresh Access Token

Exchange a refresh token for a new token pair and new cookies.

```http
POST /api/auth/refresh
```

```json
{
  "refresh_token": "<jwt>"
}
```

Without a body the `ludexis_refresh` cookie is used (send `X-Requested-With`); the cookies are renewed and the body carries no tokens.

---

## Logout

Revoke the refresh token from the body or the `ludexis_refresh` cookie and clear the session cookies.

```http
POST /api/auth/logout
```

```json
{
  "refresh_token": "<jwt>"
}
```

**Response**

```http
204 No Content
```

---

## Current User

Retrieve information about the authenticated user.

```http
GET /api/auth/me
```

---

# Authorization

Protected endpoints accept either header:

```http
Authorization: Bearer <access_token>
```

or the `ludexis_access` cookie set at login. Requests that authenticate by cookie and change data (`POST`, `PUT`, `PATCH`, `DELETE`) must also send:

```http
X-Requested-With: ludexis
```

Tokens are never accepted as URL parameters.

## Stored Artwork

```http
GET /media/{path}
```

Serves files from the artwork storage directory. Authenticated by the `Authorization` header or the session cookie, which `<img>` requests send automatically.

---

# Permission Model

Ludexis uses Role-Based Access Control (RBAC).

| Permission         | Description                               |
| ------------------ | ----------------------------------------- |
| MANAGE_USERS       | Create, modify, disable, and manage users |
| ACCESS_ADMIN       | Access administrative functionality       |
| EDIT_METADATA      | Modify metadata and taxonomy entities     |
| MANAGE_COLLECTIONS | Manage user collections                   |
| RUN_SCANS          | Launch and manage scan jobs               |
| VIEW_AUDIT_LOGS    | View system audit history                 |

---

# Common Response Codes

| Code | Meaning                       |
| ---- | ----------------------------- |
| 200  | Success                       |
| 201  | Resource created              |
| 204  | Success with no response body |
| 400  | Invalid request               |
| 401  | Authentication required       |
| 403  | Permission denied             |
| 404  | Resource not found            |
| 409  | Conflict                      |
| 500  | Internal server error         |

---

# System Setup

## Setup Status

Check whether the system has been initialized.

```http
GET /api/setup/status
```

---

## Initialize System

Creates the first administrator account.

```http
POST /api/setup
```

Example:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

---

# User Management

## List Users

```http
GET /api/users
```

Permission:

```text
MANAGE_USERS
```

---

## Create User

```http
POST /api/users
```

Permission:

```text
MANAGE_USERS
```

Example:

```json
{
  "username": "alex",
  "email": "alex@example.com",
  "password": "P@ssw0rd!",
  "role_ids": []
}
```

---

## Get User

```http
GET /api/users/{user_id}
```

---

## Update User

```http
PATCH /api/users/{user_id}
```

---

## Delete User

```http
DELETE /api/users/{user_id}
```

---

## Activate User

```http
POST /api/users/{user_id}/activate
```

---

## Deactivate User

```http
POST /api/users/{user_id}/deactivate
```

---

## Reset User Password

```http
POST /api/users/{user_id}/reset-password
```

---

# Roles

Roles group permissions together.

## List Roles

```http
GET /api/roles
```

---

## Create Role

```http
POST /api/roles
```

Example:

```json
{
  "name": "Curator",
  "description": "Curates archive metadata",
  "permission_ids": []
}
```

---

## Get Role

```http
GET /api/roles/{role_id}
```

---

## Update Role

```http
PATCH /api/roles/{role_id}
```

---

## Delete Role

```http
DELETE /api/roles/{role_id}
```

---

# Permissions

## List Permissions

```http
GET /api/permissions
```

---

## Create Permission

```http
POST /api/permissions
```

Example:

```json
{
  "name": "ACCESS_ADMIN",
  "description": "Administrative access"
}
```

---

## Get Permission

```http
GET /api/permissions/{permission_id}
```

---

# Libraries

Libraries represent physical archive locations that can be scanned.

## List Libraries

```http
GET /api/libraries
```

---

## Create Library

```http
POST /api/libraries
```

Permission:

```text
ACCESS_ADMIN
```

Example:

```json
{
  "name": "Main Library",
  "path": "D:/GameArchives",
  "enabled": true
}
```

---

## Get Library

```http
GET /api/libraries/{library_id}
```

---

## Update Library

```http
PATCH /api/libraries/{library_id}
```

---

## Delete Library

```http
DELETE /api/libraries/{library_id}
```

---

# Collections

Collections allow grouping archive entries.

## List Collections

```http
GET /api/collections
```

---

## Create Collection

```http
POST /api/collections
```

Permission:

```text
MANAGE_COLLECTIONS
```

Example:

```json
{
  "name": "Favorites",
  "description": "Favorite games",
  "visibility": "public",
  "entry_ids": []
}
```

---

## Get Collection

```http
GET /api/collections/{collection_id}
```

---

## Update Collection

```http
PATCH /api/collections/{collection_id}
```

---

## Delete Collection

```http
DELETE /api/collections/{collection_id}
```

---

## Add Entry To Collection

```http
POST /api/collections/{collection_id}/entries
```

```json
{
  "entry_id": "archive-entry-id"
}
```

---

## Remove Entry From Collection

```http
DELETE /api/collections/{collection_id}/entries/{entry_id}
```

---

# Archive Entries

Archive entries represent individual archived games or software packages.

## List Archive Entries

```http
GET /api/archive-entries
```

---

## List Versions

```http
GET /api/archive-entries/{id}/versions
```

Returns every version of the entry's game (entries sharing its `group_key`), newest first.

---

## Get Archive Entry

```http
GET /api/archive-entries/{entry_id}
```

---

## Create Archive Entry

```http
POST /api/archive-entries
```

Permission:

```text
EDIT_METADATA
```

Example:

```json
{
  "title": "Star Explorer",
  "file_path": "D:/Archives/StarExplorer.iso",
  "archive_type": "iso"
}
```

---

## Update Archive Entry

```http
PATCH /api/archive-entries/{entry_id}
```

---

## Update Metadata

```http
PATCH /api/archive-entries/{entry_id}/metadata
```

Allows manual metadata corrections and overrides.

---

## Delete Archive Entry

```http
DELETE /api/archive-entries/{entry_id}
```

---

# Tags

Tags provide flexible categorization.

## List Tags

```http
GET /api/tags
```

## Create Tag

```http
POST /api/tags
```

Permission:

```text
EDIT_METADATA
```

## Get Tag

```http
GET /api/tags/{tag_id}
```

## Update Tag

```http
PATCH /api/tags/{tag_id}
```

## Delete Tag

```http
DELETE /api/tags/{tag_id}
```

---

# Developers

Developer records store studio information.

## List Developers

```http
GET /api/developers
```

## Create Developer

```http
POST /api/developers
```

## Get Developer

```http
GET /api/developers/{developer_id}
```

## Update Developer

```http
PATCH /api/developers/{developer_id}
```

## Delete Developer

```http
DELETE /api/developers/{developer_id}
```

---

# Publishers

Publisher records store publishing organization information.

## List Publishers

```http
GET /api/publishers
```

## Create Publisher

```http
POST /api/publishers
```

## Get Publisher

```http
GET /api/publishers/{publisher_id}
```

## Update Publisher

```http
PATCH /api/publishers/{publisher_id}
```

## Delete Publisher

```http
DELETE /api/publishers/{publisher_id}
```

---

# Franchises

Franchises represent game series and relationships.

## List Franchises

```http
GET /api/franchises
```

## Create Franchise

```http
POST /api/franchises
```

## Get Franchise

```http
GET /api/franchises/{franchise_id}
```

## Update Franchise

```http
PATCH /api/franchises/{franchise_id}
```

## Delete Franchise

```http
DELETE /api/franchises/{franchise_id}
```

---

# Metadata Providers

Metadata is retrieved from external providers and used for archive enrichment.

## Search Metadata

```http
GET /api/metadata/search
```

Searches external metadata providers.

---

## Metadata Details

```http
GET /api/metadata/details
```

Retrieves complete metadata information.

---

## Metadata Artwork

```http
GET /api/metadata/artwork
```

Retrieves available artwork assets.

---

# Artwork Management

Artwork endpoints manage locally stored images.

## Upload Artwork

```http
POST /api/artwork/upload
```

Multipart form data.

Permission:

```text
EDIT_METADATA
```

---

## Replace Artwork

```http
PATCH /api/artwork/replace
```

---

## Delete Artwork

```http
DELETE /api/artwork/{artwork_id}
```

---

## Missing Artwork Report

```http
GET /api/artwork/missing
```

Returns entries missing artwork assets.

---

## Auto-Download Missing Artwork

```http
POST /api/artwork/auto-download
```

Queues an `ARTWORK_REFRESH` job that downloads missing artwork for every entry and returns the job (`202 Accepted`). If an artwork job is already running, that job is returned.

---

# Search

## Global Search

```http
GET /api/search
```

Searches archive entries across title and metadata fields.

`group_versions=true` returns one entry per game (its newest version) with `version_count` set.

---

# Scan Operations

Scanning operations discover and update archive entries from configured libraries.

## Full Scan

```http
POST /api/scan/full
```

Permission:

```text
RUN_SCANS
```

Starts a complete library scan as a LIBRARY_SCAN job. If the scan creates entries, a METADATA_REFRESH job is queued for them and its id is returned as `enrichment_job_id` in the scan job's result.

---

## Incremental Scan

```http
POST /api/scan/incremental
```

Permission:

```text
RUN_SCANS
```

Scans only for new or modified content.

---

## Scan Status

```http
GET /api/scan/status
```

Returns current scan activity information.

---

# Jobs

Jobs represent asynchronous background tasks.

## Start Job

```http
POST /api/jobs/start
```

Example:

```json
{
  "job_type": "INCREMENTAL_SCAN"
}
```

Job types: `LIBRARY_SCAN`, `INCREMENTAL_SCAN`, `METADATA_REFRESH`, `ARTWORK_REFRESH`, `INTEGRITY_VERIFICATION`, `DUPLICATE_DETECTION`.

Job responses include `status` (`PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, `CANCELED`), `progress` (0-100) and `retry_count`.

---

## Cancel Job

```http
POST /api/jobs/{job_id}/cancel
```

---

## List Jobs

```http
GET /api/jobs
```

---

## Get Job

```http
GET /api/jobs/{job_id}
```

---

# Job Monitor

Administrative monitoring endpoints for background task execution.

## Worker Status

```http
GET /api/job-monitor/workers
```

Returns active worker information.

---

## Queue Status

```http
GET /api/job-monitor/queues
```

Returns queue statistics and backlog information.

---

# Administration

Administrative endpoints expose audit and operational data.

## Audit Logs

```http
GET /api/admin/audit-logs
```

Permission:

```text
VIEW_AUDIT_LOGS
```

Returns security and system activity history.

---

## System Statistics

```http
GET /api/admin/stats
```

Permission:

```text
ACCESS_ADMIN
```

Returns aggregate system metrics.

---

## Dashboard Overview

```http
GET /api/admin/dashboard
```

Permission:

```text
ACCESS_ADMIN
```

Provides a consolidated administrative overview.

---

## Scheduled Tasks

Requires `ACCESS_ADMIN`.

```http
GET /api/admin/scheduled-tasks
PATCH /api/admin/scheduled-tasks/{key}
POST /api/admin/scheduled-tasks/{key}/run
```

Keys: `library_scan` (incremental scan; offline libraries are retried at the next run), `metadata_refresh`, `artwork_validation`, `integrity_verification`, `duplicate_detection`. A task runs daily at `hour:minute` (server local time) or weekly when `day_of_week` is 0 (Monday) to 6; send `day_of_week: -1` to make it daily again. `run` starts the job now and returns it (`202`).

```json
{ "enabled": true, "hour": 2, "minute": 0, "day_of_week": -1 }
```

---

## Server Settings

Requires `ACCESS_ADMIN`.

```http
GET /api/admin/settings
PATCH /api/admin/settings
```

```json
{
  "server_name": "Ludexis",
  "provider_order": ["VNDB", "IGDB", "Steam"],
  "igdb_client_id": "<twitch client id>",
  "igdb_client_secret": "<twitch client secret>"
}
```

`provider_order` sets which metadata sources auto-matching uses and in which order; a provider left out is disabled. The IGDB secret is write-only, and `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET` environment variables override the saved credentials (`igdb_from_env` in the response).

---

# Health Monitoring

Health endpoints are intended for monitoring systems, container orchestration, and uptime checks.

## API Health

```http
GET /api/health
```

Returns overall API status.

---

## Database Health

```http
GET /api/health/db
```

Verifies database connectivity.

---

## Redis Health

```http
GET /api/health/redis
```

Verifies Redis connectivity.

---

# Public Health Endpoint

Outside the API namespace:

```http
GET /healthz
```

Response:

```json
{
  "status": "ok"
}
```

Used by container orchestrators, reverse proxies, and uptime monitoring systems.

---

# OpenAPI Documentation

Interactive API documentation is automatically generated by FastAPI.

Swagger UI:

```text
/docs
```

OpenAPI Schema:

```text
/openapi.json
```

ReDoc:

```text
/redoc
```
