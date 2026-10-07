<p align="center">
  <img src="docs/Ludexis.png" width="450">
</p>

<!--
<p align="center" style="font-size: 40px;""><strong>Ludexis</strong></p>
-->

<p align="center">
  <strong>Self-Hosted Game Archive & Metadata Management Platform</strong>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#developer-setup">Developer Setup</a> •
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  Ludexis is a self-hosted platform for cataloging and preserving game archives. Unlike traditional game launchers, Ludexis focuses on metadata management, artwork acquisition, organization, and long-term archival workflows for collections consisting of ZIP archives, installer packages, visual novels, ROM collections, and preservation projects.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-6D3DF5?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-6D3DF5?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16+-6D3DF5?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-7+-6D3DF5?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Celery-5.4+-6D3DF5?logo=celery&logoColor=white" />
  <img src="https://img.shields.io/badge/Grafana-Enabled-6D3DF5?logo=grafana&logoColor=white" />
  <img src="https://img.shields.io/badge/Prometheus-Enabled-6D3DF5?logo=prometheus&logoColor=white" />
</p>

---

## Why Ludexis?

Ludexis began as a response to a problem that many digital preservation enthusiasts, visual novel collectors, retro gaming archivists, and self-hosting users eventually encounter: there are plenty of game launchers, but very few tools designed specifically for managing large game archives.

Most existing platforms focus on launching installed games. Their catalogs are typically built around executable discovery, launcher integration, storefront synchronization, or installation management. This works well for modern Steam libraries but becomes increasingly limiting when dealing with preservation-oriented collections.

Many archives consist of compressed releases, installer packages, visual novels, portable games, ROM collections, abandonware archives, backup media, and other content that may never be installed or directly executable. In these scenarios, the archive itself is often the asset being managed rather than a runnable game installation.

Ludexis approaches the problem from a different perspective. Instead of asking "How do I launch this game?", it asks "How do I catalog, organize, enrich, preserve, and manage this archive?"

A single Ludexis deployment can catalog content such as:

```mermaid
flowchart TB

    A[Game Archives]

    A --> B[ZIP Archives]
    A --> C[RAR Archives]
    A --> D[7z Archives]
    A --> E[Installer Packages]
    A --> F[Portable Games]
    A --> G[Visual Novels]
    A --> H[ROM Collections]
    A --> I[Preservation Projects]
    A --> J[Backup Libraries]
```

Rather than depending on launchers, executables, storefront APIs, or installed applications, Ludexis focuses on metadata management, artwork acquisition, catalog organization, archive preservation, and long-term collection maintenance.

The result is a platform designed specifically for users who maintain game archives rather than game installations.

---

## Overview

Ludexis is a self-hosted game archive management platform designed for users who maintain collections of installers, archived game releases, visual novels, preservation projects, backups, and multi-drive game libraries.

As collections grow across hard drives, NAS systems, external storage devices, and backup archives, maintaining accurate records becomes increasingly difficult. Information such as release versions, publishers, developers, storage locations, screenshots, artwork, and related titles often becomes fragmented or lost entirely.

Ludexis solves this problem by transforming raw archive files into a searchable and enriched catalog. Through automated scanning, metadata matching, artwork acquisition, collections, tagging, and background processing, Ludexis provides a centralized platform for managing and preserving game archives.

Unlike traditional game launchers, Ludexis focuses on cataloging, organization, metadata enrichment, and long-term archival management rather than game launching.

---

## Key Features

### Automated Library Discovery & Scanning

Ludexis continuously catalogs game archives stored across local drives, external storage devices, NAS systems, and archival repositories. Libraries can be configured as scan targets, allowing the platform to automatically discover supported archives and game folders without requiring manual entry.

Both full and incremental scanning modes are supported. Full scans rebuild catalog information across an entire library, while incremental scans process only newly added or modified content, significantly reducing maintenance overhead for large collections.

Discovered entries are normalized and stored in a structured catalog, enabling consistent metadata enrichment and organization regardless of the original archive source.

### Metadata Aggregation & Enrichment

Ludexis automatically enriches archive entries from VNDB, IGDB and Steam through a provider-agnostic architecture that allows additional metadata sources to be integrated over time. A match on one source is completed with whatever the others know about the same game, and any entry can be identified by hand from a search across all of them.

Metadata enrichment transforms raw archive files into richly cataloged entries by retrieving official game information and associating it with discovered archives.

```mermaid
flowchart TB

    A[Metadata Enrichment]

    A --> B[Game Titles]
    A --> C[Descriptions]
    A --> D[Release Information]
    A --> E[Developers]
    A --> F[Publishers]
    A --> G[Genres]
    A --> H[Franchises]
    A --> I[Platforms]
    A --> J[Ratings]
    A --> K[Related Titles]
```

This allows raw archive files to be transformed into rich, searchable catalog entries without extensive manual curation.

### Artwork Acquisition & Management

Ludexis supports comprehensive artwork management for archive entries. Artwork assets are stored locally to ensure long-term availability independent of third-party services.

```mermaid
flowchart TB

    A[Artwork Management]

    A --> B[Covers]
    A --> C[Banners]
    A --> D[Logos]
    A --> E[Screenshots]
```

Artwork may be uploaded manually or automatically acquired through the metadata enrichment pipeline. Validation and maintenance operations ensure artwork remains synchronized with associated archive entries while avoiding duplicate assets and broken references.

### Advanced Catalog Organization

Beyond simple file storage, Ludexis provides multiple organizational layers for managing large collections.

```mermaid
flowchart TB

    A[Catalog Organization]

    A --> B[Collections]
    A --> C[Genres]
    A --> D[Tags]
    A --> E[Franchises]
    A --> F[Developers]
    A --> G[Publishers]
    A --> H[Notes]
    A --> I[Ratings]
```

These relationships allow users to build curated collections and navigate large archives through meaningful metadata rather than filesystem structure alone.

### Archive Preservation & Verification

Ludexis is designed with preservation-oriented workflows in mind. Archive records maintain filesystem metadata, verification status, storage information, and catalog history to support long-term archival management.

Planned integrity workflows include archive verification, corruption detection, duplicate identification, and preservation auditing to assist users maintaining large game collections over extended periods.

### User Management & Role-Based Access Control

The platform includes a complete authentication and authorization system built around Role-Based Access Control (RBAC).

```mermaid
flowchart TB

    A[RBAC]

    A --> B[Users]
    A --> C[Roles]
    A --> D[Permissions]
    A --> E[Authentication]
    A --> F[Authorization]
    A --> G[Audit Logging]
```

This enables Ludexis to scale from single-user deployments to shared archival environments.

### Background Processing & Job Management

Long-running operations execute asynchronously through Celery workers, ensuring the API remains responsive regardless of collection size.

```mermaid
flowchart TB

    A[Background Jobs]

    A --> B[Full Scans]
    A --> C[Incremental Scans]
    A --> D[Metadata Refresh]
    A --> E[Artwork Validation]
    A --> F[Artwork Acquisition]
```

A centralized job system provides visibility into task progress, execution history, completion status, and failure reporting.

### Monitoring & Observability

Ludexis includes built-in operational monitoring through Prometheus and Grafana.

```mermaid
flowchart TB

    A[Monitoring]

    A --> B[Prometheus]
    A --> C[Grafana]
    A --> D[Authentication Metrics]
    A --> E[Scan Metrics]
    A --> F[Metadata Metrics]
    A --> G[Artwork Metrics]
    A --> H[Infrastructure Metrics]
```

Infrastructure monitoring is provided through Node Exporter by default, with optional Windows Exporter support available for native Windows host telemetry.

These capabilities allow administrators to monitor system health, workload activity, and resource utilization without requiring additional monitoring infrastructure.

---

## Architecture Overview

Ludexis follows a service-oriented architecture designed around clear separation of responsibilities, asynchronous processing, and persistent metadata storage.

```mermaid
flowchart LR

    Libraries["Game Libraries"]

    Backend["Ludexis API"]

    PostgreSQL["PostgreSQL"]

    Redis["Redis"]

    Workers["Celery Workers"]

    Metadata["Metadata Providers"]

    Artwork["Artwork Storage"]

    UI["Clients / Frontend"]

    Libraries --> Backend

    Backend --> PostgreSQL
    Backend --> Redis

    Redis --> Workers

    Workers --> Metadata
    Workers --> Artwork
    Workers --> PostgreSQL

    UI --> Backend
```

The FastAPI backend serves as the central orchestration layer, coordinating authentication, catalog management, metadata operations, search functionality, and administrative workflows. PostgreSQL stores all persistent data, Redis provides task queue infrastructure, and Celery workers execute long-running background operations independently from user-facing requests.

---

## How Ludexis Works

The processing pipeline transforms raw archive files into fully cataloged archive entries.

```mermaid
flowchart LR

    A[Archive Files]
    --> B[Library Scan]

    B --> C[Archive Detection]

    C --> D[Metadata Matching]

    D --> E[Artwork Acquisition]

    E --> F[Searchable Catalog]
```

When a library scan is initiated, Ludexis discovers archive files and folders, extracts filesystem metadata, creates catalog entries, enriches them using metadata providers, downloads available artwork, and stores the resulting information in a searchable database.

This workflow allows large collections to be cataloged with minimal manual effort while still supporting manual curation when required.

## Screenshots

Frontend development is currently in progress.

Screenshots and usage demonstrations will be added as the user interface matures.

<!-- > Screenshots will be added as the frontend matures.

### Dashboard

![Dashboard Placeholder](docs/assets/dashboard-placeholder.png)

### Archive Entry

![Archive Entry Placeholder](docs/assets/archive-placeholder.png)

### Metadata Search

![Metadata Search Placeholder](docs/assets/metadata-placeholder.png)
-->

---

## Quick Start

Ludexis runs as one Docker Compose stack: the web app, API, background worker, scheduler, PostgreSQL, Redis and a small proxy that serves everything on a single port.

### Requirements

- Docker Engine 24+ with Docker Compose
- 2 GB RAM (4 GB recommended for large libraries)
- A folder of games: unpacked game folders and/or archives (`.zip`, `.rar`, `.7z`, `.iso`, `.exe`)

### Install

```bash
curl -O https://raw.githubusercontent.com/InvictusRex/Ludexis/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/InvictusRex/Ludexis/main/.env.example
mkdir deploy && curl -o deploy/Caddyfile https://raw.githubusercontent.com/InvictusRex/Ludexis/main/deploy/Caddyfile
cp .env.example .env
```

Edit `.env`:

```env
GAMES_PATH=/mnt/games    # the folder holding your games, mounted read-only at /games
TZ=Europe/Berlin         # scheduled tasks run in this time zone
POSTGRES_PASSWORD=change-me
```

Or clone the repository and run the same commands from its root; `docker compose up -d --build` builds the images from source.

### Start

```bash
docker compose up -d
```

Open `http://<host>:8420`. The setup wizard creates the administrator, adds `/games` as the first library, optionally stores IGDB credentials and starts the first scan.

The JWT signing secret is generated on first start and kept in the `ludexis_data` volume; set `JWT_SECRET_KEY` only if you want to manage it yourself.

### Metadata sources

| Source | Key needed | Good for |
| ------ | ---------- | -------- |
| VNDB   | No         | Visual novels and Ren'Py games |
| IGDB   | Twitch client ID and secret ([dev.twitch.tv](https://dev.twitch.tv/console)) | Most commercial games |
| Steam  | No         | Steam releases, descriptions and screenshots |

Order and enable them under **Admin > Settings**. The first source with a confident match supplies the metadata, and the other enabled sources fill what it lacks (genres, franchises, artwork) when they clearly have the same game. Developer and publisher names are merged across spellings, so "SEGA" and "Sega" are one company.

When a match is missing or wrong, open the game and choose **Identify**: search VNDB, IGDB or Steam (or all of them), pick the right result, and its metadata is applied to every version of the game while fresh artwork downloads in the background.

### Drives that come and go

Libraries on external or network drives can be disconnected at any time. The nightly scan marks a library **Offline** when its folder is missing (or empty while it still has entries), skips it, and keeps every entry and its metadata. The next nightly scan after the drive comes back marks it **Online** and rescans it in full. Schedules live under **Admin > Scheduled Tasks**.

### Updating

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically when the backend starts.

### HTTPS

On a home network the plain `http://<host>:8420` address is fine. Before exposing Ludexis to the internet, point a domain name at the host and set in `.env`:

```env
LUDEXIS_DOMAIN=games.example.com
LUDEXIS_PORT=80
LUDEXIS_HTTPS_PORT=443
```

After `docker compose up -d`, Caddy obtains and renews a certificate for the domain, redirects HTTP to HTTPS, and the session cookies are marked `Secure`. Certificates are kept in the `caddy_data` volume.

### Backups

Everything worth keeping is the database and the `ludexis_data` volume (artwork and the generated JWT secret). From the folder with `docker-compose.yml`:

```bash
docker compose exec -T db pg_dump -U ludexis -Fc ludexis > ludexis-db.dump
docker compose run --rm --no-deps -v "$PWD:/backup" --entrypoint tar backend czf /backup/ludexis-data.tgz -C /data .
```

To restore into a fresh stack, start only the database, load the dump, unpack the data, then start everything:

```bash
docker compose up -d db
docker compose exec -T db pg_restore -U ludexis -d ludexis --clean --if-exists < ludexis-db.dump
docker compose run --rm --no-deps -v "$PWD:/backup" --entrypoint tar backend xzf /backup/ludexis-data.tgz -C /data
docker compose up -d
```

Your games themselves are never modified, so they need no backup from Ludexis.

### Initial Configuration

After deployment, create the initial administrator account and configure the archive libraries that Ludexis should manage.

A typical setup workflow consists of:

```mermaid
flowchart LR

    A[Deploy Platform]
    --> B[Create Administrator]

    B --> C[Configure Libraries]

    C --> D[Run Initial Scan]

    D --> E[Metadata Enrichment]

    E --> F[Artwork Acquisition]

    F --> G[Searchable Archive]
```

Once the first scan completes, archive entries become available for metadata enrichment, artwork acquisition, search, categorization, and collection management.

---

## Monitoring & Observability

Ludexis includes a built-in observability stack for monitoring application health, infrastructure performance, and background processing activity.

### Prometheus Metrics

The backend exposes Prometheus-compatible metrics through:

```text
/api/metrics
```

Metrics currently include:

- Authentication activity
- Library scans
- Incremental scans
- Metadata searches
- Artwork operations
- Background job execution

### Grafana Dashboards

Grafana dashboards can be used to visualize:

- User activity
- Scan throughput
- Metadata operations
- Artwork processing
- API metrics
- Infrastructure performance

### Infrastructure Monitoring

By default, Ludexis deploys Node Exporter to provide host-level metrics including:

- CPU utilization
- Memory usage
- Disk consumption
- Network statistics

---

## Optional Windows Exporter

Node Exporter provides cross-platform metrics and is enabled by default.

Users requiring native Windows performance counters may additionally enable Windows Exporter:

```bash
docker compose --profile windows_exporter up -d
```

This exposes Windows-specific metrics while preserving the default monitoring stack.

---

## First-Time Setup

After deployment:

1. Open Swagger UI.

```text
http://localhost:8000/docs
```

2. Run the initial setup endpoint.

3. Create the administrator account.

4. Login and obtain an access token.

5. Configure one or more game libraries.

6. Start the first library scan.

7. Begin metadata enrichment and artwork acquisition.

---

## Developer Setup

Ludexis supports a contributor-focused development workflow that separates application execution from infrastructure services. During development, PostgreSQL, Redis, Prometheus, Grafana, and exporter services run through Docker while the FastAPI backend and Celery workers execute directly on the host machine for improved debugging, hot reload support, and IDE integration.

### Clone the Repository

```bash
git clone https://github.com/InvictusRex/Ludexis.git

cd Ludexis/backend
```

### Create a Virtual Environment

```bash
python -m venv .venv
```

### Activate the Environment

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Linux: Create a local environment file and configure the required values.

```bash
cp .env.docker .env
```

Windows: Create a local `.env` file using `.env.docker` as a template and update any required credentials before starting development.

At minimum, the following values should be reviewed before development:

```env
DATABASE_URL=
REDIS_URL=
CELERY_BROKER_URL=
CELERY_RESULT_BACKEND=

JWT_SECRET_KEY=   # at least 32 characters: openssl rand -hex 32

TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
STEAMGRIDDB_API_KEY=
```

### Start Development Infrastructure

```bash
docker compose -f dev/docker-compose.infra.yml up -d
```

Optional Windows host metrics can be enabled using:

```bash
docker compose -f dev/docker-compose.infra.yml --profile windows_exporter up -d
```

This command launches PostgreSQL, Redis, Prometheus, Grafana, and Node Exporter, providing all supporting infrastructure required for local development.

### Start the Backend

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

### Start Celery Worker

Open a second terminal and run:

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

On Windows add `--pool=solo`.

### Start Celery Beat

Scheduled tasks (nightly library scan, metadata refresh, artwork validation and the weekly checks) need the beat scheduler in a third terminal:

```bash
celery -A app.tasks.celery_app beat --loglevel=info
```

### Run Tests

```bash
pytest
```

### Development Monitoring

The observability stack remains available during development.

| Service    | URL                   |
| ---------- | --------------------- |
| Prometheus | http://localhost:9090 |
| Grafana    | http://localhost:3000 |

This setup mirrors the workflow used during active Ludexis development and provides full access to monitoring, debugging, and testing capabilities while maintaining a lightweight local development environment.

---

## Documentation

Detailed documentation is organized within the `docs/` directory.

| Directory            | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `docs/architecture/` | System architecture, backend architecture, data model, ERD, and processing pipeline documentation |
| `docs/api/`          | REST API reference and integration guidance                                                       |
| `docs/deployment/`   | Deployment, infrastructure, and operational documentation                                         |
| `docs/integrations/` | cURL, Python, and JavaScript integration examples                                                 |
| `docs/backlog/`      | Project backlogs, development milestones, and future planning                                     |

The README focuses on installation, configuration, and day-to-day usage. Detailed technical documentation, architectural decisions, deployment guidance, and implementation references are maintained separately within the documentation directory.

---

## Development Roadmap

Ludexis is under active development. Current development status, completed milestones, planned features, and future objectives are maintained in:

```text
docs/backlog/Frontend_Backlog.md
docs/backlog/Backend_Backlog.md
```

For architectural and implementation details, refer to the documentation contained within the `docs/architecture/`, `docs/api/`, and `docs/deployment/` directories.

## License

This project is licensed under the MIT License.

See the LICENSE file for additional details.

---

## Acknowledgements

Ludexis relies on several open-source technologies and metadata ecosystems, including FastAPI, PostgreSQL, Redis, Celery, Prometheus, Grafana, IGDB, Docker.
Their contributions make modern self-hosted software ecosystems possible.
