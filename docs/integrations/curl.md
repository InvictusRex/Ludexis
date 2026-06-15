# Ludexis API Integration Examples (cURL)

This guide demonstrates common Ludexis API workflows using cURL. These examples assume a default local deployment running at:

```bash
http://localhost:8000
```

For a complete API reference, visit:

```text
http://localhost:8000/docs
```

---

## Authentication

Authenticate with a username and password to obtain access and refresh tokens.

```bash
curl -X POST http://localhost:8000/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "username": "<username>",
  "password": "<password>"
}'
```

Example response:

```json
{
  "access_token": "<access_token>",
  "refresh_token": "<refresh_token>",
  "token_type": "bearer"
}
```

Store the access token for subsequent requests:
Linux:

```bash
export TOKEN="<access_token>"
```

Windows PowerShell:

```powershell
$TOKEN = "<access_token>"
```

All subsequent examples assume the access token has been stored in the `TOKEN` variable.

---

## Get Current User

Retrieve information about the currently authenticated user.

```bash
curl http://localhost:8000/api/auth/me \
-H "Authorization: Bearer $TOKEN"
```

---

## List Archive Entries

Retrieve archive entries from the catalog.

```bash
curl http://localhost:8000/api/archive-entries \
-H "Authorization: Bearer $TOKEN"
```

Pagination can be applied using query parameters:

```bash
curl "http://localhost:8000/api/archive-entries?offset=0&limit=50" \
-H "Authorization: Bearer $TOKEN"
```

---

## Search Metadata

Search external metadata providers.

```bash
curl "http://localhost:8000/api/metadata/search?q=Mass%20Effect" \
-H "Authorization: Bearer $TOKEN"
```

---

## Retrieve Metadata Details

Fetch detailed metadata from a provider.

```bash
curl "http://localhost:8000/api/metadata/details/igdb/12345" \
-H "Authorization: Bearer $TOKEN"
```

---

## Start a Full Library Scan

Create a background scan job.

```bash
curl -X POST http://localhost:8000/api/jobs/start \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "job_type": "LIBRARY_SCAN"
}'
```

Example response:

```json
{
  "id": "job-id",
  "status": "PENDING"
}
```

---

## Start Incremental Scan

```bash
curl -X POST http://localhost:8000/api/jobs/start \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "job_type": "INCREMENTAL_SCAN"
}'
```

Example response:

```json
{
  "id": "job-id",
  "status": "PENDING"
}
```

---

## Check Job Status

Retrieve the status of a running background job.

```bash
curl http://localhost:8000/api/jobs/<job_id> \
-H "Authorization: Bearer $TOKEN"
```

List all jobs:

```bash
curl http://localhost:8000/api/jobs \
-H "Authorization: Bearer $TOKEN"
```

---

## Find Duplicate Archives

Identify archives that share identical file hashes.

```bash
curl http://localhost:8000/api/archive-entries/duplicates \
-H "Authorization: Bearer $TOKEN"
```

Example response:

```json
[
  {
    "file_hash": "6c9d6f...",
    "count": 2,
    "entries": [
      {
        "id": "entry-1",
        "title": "Mass Effect",
        "file_path": "/games/mass_effect.zip"
      },
      {
        "id": "entry-2",
        "title": "Mass Effect",
        "file_path": "/backup/mass_effect.zip"
      }
    ]
  }
]
```

---

## List Missing Artwork

Retrieve archive entries that are missing required artwork.

```bash
curl http://localhost:8000/api/artwork/missing \
-H "Authorization: Bearer $TOKEN"
```

---

## Trigger Automatic Artwork Download

Automatically download missing artwork where supported.

```bash
curl -X POST http://localhost:8000/api/artwork/auto-download \
-H "Authorization: Bearer $TOKEN"
```

---

## Upload Artwork

Upload a cover image for an archive entry.

```bash
curl -X POST http://localhost:8000/api/artwork/upload \
-H "Authorization: Bearer $TOKEN" \
-F "archive_entry_id=<archive_entry_id>" \
-F "artwork_type=cover" \
-F "file=@cover.jpg"
```

---

## Health Checks

Verify application and infrastructure health.

```bash
curl http://localhost:8000/api/health/
```

Database health:

```bash
curl http://localhost:8000/api/health/db
```

Redis health:

```bash
curl http://localhost:8000/api/health/redis
```

---

## Metrics

Retrieve Prometheus metrics exposed by Ludexis.

```bash
curl http://localhost:8000/api/metrics
```

---

## Refresh Tokens

Exchange a refresh token for a new access token.

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
-H "Content-Type: application/json" \
-d '{
  "refresh_token": "<refresh_token>"
}'
```

---

## Logout

Revoke a refresh token.

```bash
curl -X POST http://localhost:8000/api/auth/logout \
-H "Content-Type: application/json" \
-d '{
  "refresh_token": "<refresh_token>"
}'
```
