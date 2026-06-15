# Ludexis API Integration Examples (Python)

This guide demonstrates common Ludexis API workflows using Python and the `requests` library.

These examples assume a default local deployment running at:

```text
http://localhost:8000
```

For a complete API reference, visit:

```text
http://localhost:8000/docs
```

---

## Installation

Install the required dependency:

```bash
pip install requests
```

---

## Authentication

Authenticate with Ludexis and obtain access and refresh tokens.

```python
import requests

BASE_URL = "http://localhost:8000/api"

response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "username": "<username>",
        "password": "<password>",
    },
)

response.raise_for_status()

tokens = response.json()

access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]

print("Authenticated successfully")
```

---

## Create an Authenticated Session

Using a persistent session simplifies subsequent requests.

```python
import requests

session = requests.Session()

session.headers.update(
    {
        "Authorization": f"Bearer {access_token}",
    }
)
```

All remaining examples assume this authenticated session.

---

## Retrieve Current User

```python
response = session.get(
    f"{BASE_URL}/auth/me"
)

response.raise_for_status()

current_user = response.json()

print(current_user)
```

---

## List Archive Entries

Retrieve archive entries from the catalog.

```python
response = session.get(
    f"{BASE_URL}/archive-entries",
    params={
        "offset": 0,
        "limit": 50,
    },
)

response.raise_for_status()

archives = response.json()

print(f"Retrieved {len(archives)} archive entries")
```

---

## Search Metadata

Search configured metadata providers.

```python
response = session.get(
    f"{BASE_URL}/metadata/search",
    params={
        "q": "Mass Effect",
    },
)

response.raise_for_status()

results = response.json()

print(results)
```

---

## Retrieve Metadata Details

```python
provider_name = "igdb"
provider_id = "12345"

response = session.get(
    f"{BASE_URL}/metadata/details/{provider_name}/{provider_id}"
)

response.raise_for_status()

metadata = response.json()

print(metadata)
```

---

## Start a Full Library Scan

Create a background scan job.

```python
response = session.post(
    f"{BASE_URL}/jobs/start",
    json={
        "job_type": "LIBRARY_SCAN",
    },
)

response.raise_for_status()

job = response.json()

print(job["id"])
```

---

## Start an Incremental Scan

```python
response = session.post(
    f"{BASE_URL}/jobs/start",
    json={
        "job_type": "INCREMENTAL_SCAN",
    },
)

response.raise_for_status()

job = response.json()

print(job["id"])
```

---

## Monitor Job Progress

```python
job_id = "<job_id>"

response = session.get(
    f"{BASE_URL}/jobs/{job_id}"
)

response.raise_for_status()

job = response.json()

print(
    job["status"],
    job["progress"],
)
```

---

## List Jobs

```python
response = session.get(
    f"{BASE_URL}/jobs"
)

response.raise_for_status()

jobs = response.json()

print(jobs)
```

---

## Find Duplicate Archives

Identify archives that share identical file hashes.

```python
response = session.get(
    f"{BASE_URL}/archive-entries/duplicates"
)

response.raise_for_status()

duplicates = response.json()

for group in duplicates:
    print(
        group["file_hash"],
        group["count"],
    )
```

---

## List Missing Artwork

```python
response = session.get(
    f"{BASE_URL}/artwork/missing"
)

response.raise_for_status()

missing_artwork = response.json()

print(missing_artwork)
```

---

## Trigger Automatic Artwork Download

```python
response = session.post(
    f"{BASE_URL}/artwork/auto-download"
)

response.raise_for_status()

print(response.json())
```

---

## Upload Artwork

Upload a cover image for an archive entry.

```python
archive_entry_id = "<archive_entry_id>"

with open("cover.jpg", "rb") as artwork_file:
    response = session.post(
        f"{BASE_URL}/artwork/upload",
        data={
            "archive_entry_id": archive_entry_id,
            "artwork_type": "cover",
        },
        files={
            "file": artwork_file,
        },
    )

response.raise_for_status()

print(response.json())
```

---

## Refresh Tokens

Exchange a refresh token for new credentials.

```python
response = requests.post(
    f"{BASE_URL}/auth/refresh",
    json={
        "refresh_token": refresh_token,
    },
)

response.raise_for_status()

tokens = response.json()

access_token = tokens["access_token"]
refresh_token = tokens["refresh_token"]
```

---

## Logout

Revoke a refresh token.

```python
response = requests.post(
    f"{BASE_URL}/auth/logout",
    json={
        "refresh_token": refresh_token,
    },
)

response.raise_for_status()

print("Logged out successfully")
```

---

## Health Checks

```python
response = requests.get(
    f"{BASE_URL}/health/"
)

print(response.json())
```

Database health:

```python
response = requests.get(
    f"{BASE_URL}/health/db"
)

print(response.json())
```

Redis health:

```python
response = requests.get(
    f"{BASE_URL}/health/redis"
)

print(response.json())
```

---

## Metrics

Retrieve Prometheus metrics exposed by Ludexis.

```python
response = requests.get(
    f"{BASE_URL}/metrics"
)

print(response.text)
```
