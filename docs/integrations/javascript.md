# Ludexis API Integration Examples (JavaScript)

This guide demonstrates common Ludexis API workflows using modern JavaScript and the Fetch API.

These examples work in:

- Browsers
- Node.js 18+
- Bun
- Deno

These examples assume a default local deployment running at:

```text
http://localhost:8000
```

For a complete API reference, visit:

```text
http://localhost:8000/docs
```

---

## Authentication

Authenticate with Ludexis and obtain access and refresh tokens.

```javascript
const BASE_URL = "http://localhost:8000/api";

const response = await fetch(`${BASE_URL}/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "<username>",
    password: "<password>",
  }),
});

if (!response.ok) {
  throw new Error("Authentication failed");
}

const tokens = await response.json();

let accessToken = tokens.access_token;
let refreshToken = tokens.refresh_token;

console.log("Authenticated successfully");
```

---

## Create Authentication Headers

Create a reusable Authorization header for subsequent requests.

```javascript
const authHeaders = {
  Authorization: `Bearer ${accessToken}`,
};
```

All remaining examples assume these authentication headers are available.

---

## Retrieve Current User

```javascript
const response = await fetch(`${BASE_URL}/auth/me`, {
  headers: authHeaders,
});

const currentUser = await response.json();

console.log(currentUser);
```

---

## List Archive Entries

Retrieve archive entries from the catalog.

```javascript
const response = await fetch(`${BASE_URL}/archive-entries?offset=0&limit=50`, {
  headers: authHeaders,
});

const archives = await response.json();

console.log(`Retrieved ${archives.length} archive entries`);
```

---

## Search Metadata

Search configured metadata providers.

```javascript
const response = await fetch(`${BASE_URL}/metadata/search?q=Mass%20Effect`, {
  headers: authHeaders,
});

const results = await response.json();

console.log(results);
```

---

## Retrieve Metadata Details

```javascript
const providerName = "igdb";
const providerId = "12345";

const response = await fetch(
  `${BASE_URL}/metadata/details/${providerName}/${providerId}`,
  {
    headers: authHeaders,
  },
);

const metadata = await response.json();

console.log(metadata);
```

---

## Start a Full Library Scan

Create a background scan job.

```javascript
const response = await fetch(`${BASE_URL}/jobs/start`, {
  method: "POST",
  headers: {
    ...authHeaders,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    job_type: "LIBRARY_SCAN",
  }),
});

const job = await response.json();

console.log(job.id);
```

---

## Start an Incremental Scan

```javascript
const response = await fetch(`${BASE_URL}/jobs/start`, {
  method: "POST",
  headers: {
    ...authHeaders,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    job_type: "INCREMENTAL_SCAN",
  }),
});

const job = await response.json();

console.log(job.id);
```

---

## Monitor Job Progress

```javascript
const jobId = "<job_id>";

const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
  headers: authHeaders,
});

const job = await response.json();

console.log(job.status, job.progress);
```

---

## List Jobs

```javascript
const response = await fetch(`${BASE_URL}/jobs`, {
  headers: authHeaders,
});

const jobs = await response.json();

console.log(jobs);
```

---

## Find Duplicate Archives

Identify archives that share identical file hashes.

```javascript
const response = await fetch(`${BASE_URL}/archive-entries/duplicates`, {
  headers: authHeaders,
});

const duplicates = await response.json();

duplicates.forEach((group) => {
  console.log(group.file_hash, group.count);
});
```

---

## List Missing Artwork

```javascript
const response = await fetch(`${BASE_URL}/artwork/missing`, {
  headers: authHeaders,
});

const missingArtwork = await response.json();

console.log(missingArtwork);
```

---

## Trigger Automatic Artwork Download

```javascript
const response = await fetch(`${BASE_URL}/artwork/auto-download`, {
  method: "POST",
  headers: authHeaders,
});

const result = await response.json();

console.log(result);
```

---

## Upload Artwork

Upload a cover image for an archive entry.

```javascript
const fileInput = document.querySelector("#artwork-file");

const formData = new FormData();

formData.append("archive_entry_id", "<archive_entry_id>");

formData.append("artwork_type", "cover");

formData.append("file", fileInput.files[0]);

const response = await fetch(`${BASE_URL}/artwork/upload`, {
  method: "POST",
  headers: authHeaders,
  body: formData,
});

const result = await response.json();

console.log(result);
```

---

## Refresh Tokens

Exchange a refresh token for new credentials.

```javascript
const response = await fetch(`${BASE_URL}/auth/refresh`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    refresh_token: refreshToken,
  }),
});

const tokens = await response.json();

accessToken = tokens.access_token;
refreshToken = tokens.refresh_token;
```

---

## Logout

Revoke a refresh token.

```javascript
await fetch(`${BASE_URL}/auth/logout`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    refresh_token: refreshToken,
  }),
});

console.log("Logged out successfully");
```

---

## Health Checks

```javascript
const response = await fetch(`${BASE_URL}/health/`);

const health = await response.json();

console.log(health);
```

Database health:

```javascript
const response = await fetch(`${BASE_URL}/health/db`);

console.log(await response.json());
```

Redis health:

```javascript
const response = await fetch(`${BASE_URL}/health/redis`);

console.log(await response.json());
```

---

## Metrics

Retrieve Prometheus metrics exposed by Ludexis.

```javascript
const response = await fetch(`${BASE_URL}/metrics`);

const metrics = await response.text();

console.log(metrics);
```
