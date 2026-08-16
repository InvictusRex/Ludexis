# Ludexis Frontend

Web interface for [Ludexis](../README.md), a self-hosted game archive management
platform. Built with Next.js (App Router), React 19, Tailwind CSS v4, and
TypeScript.

## Requirements

- Node.js 20+ (pnpm, npm, or yarn)
- A running [Ludexis backend](../backend) exposing the REST API (default
  `http://localhost:8000`)

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If the backend has no
administrator yet, complete the setup flow at `/auth/setup`; otherwise log in.

## Environment Variables

| Variable               | Default                    | Description                                  |
| ---------------------- | -------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:8000/api`| Base URL of the backend REST API             |
| `NEXT_PUBLIC_MEDIA_URL`| `http://localhost:8000/media` | Base URL where artwork media is served   |
| `NEXT_PUBLIC_DEBUG`    | `0`                        | Set to `1` for verbose API logging           |

Note: variables prefixed with `NEXT_PUBLIC_` are inlined at build time. In a
Docker build they are supplied as build arguments (see below).

## Scripts

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Next.js development server          |
| `npm run build`   | Create a production build                     |
| `npm run start`   | Serve the production build                    |
| `npm run lint`    | Run ESLint                                    |
| `npm test`        | Run the Vitest unit/integration suite         |
| `npm run test:e2e`| Run Playwright end-to-end tests               |

## Project Structure

```text
app/              Next.js App Router pages and layouts
components/       UI primitives (ui/) and feature components (common/)
contexts/         React contexts (authentication)
hooks/            Custom hooks
lib/              API clients, types, media and pagination helpers
e2e/              Playwright end-to-end and visual regression tests
```

## Testing

- **Unit / integration:** Vitest + React Testing Library
  (`npm test`). Uses `vitest.config.ts` and `vitest.setup.ts`.
- **End-to-end:** Playwright against a live dev server (`npm run test:e2e`).
  Browsers: Chromium by default; Firefox and WebKit projects are configured.
- **Visual regression:** `e2e/visual.spec.ts` captures key screenshots
  (login, library, archive detail, admin, monitoring). Regenerate baselines
  with:

  ```bash
  npx playwright test e2e/visual.spec.ts --update-snapshots
  ```

## Docker Deployment

The `Dockerfile` produces a standalone Next.js image served by its own Node
server. The API base URL is baked at build time:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000/api \
  --build-arg NEXT_PUBLIC_MEDIA_URL=http://localhost:8000/media \
  -t ludexis-frontend ./frontend

docker run -p 3000:3000 ludexis-frontend
```

For the full stack (backend + database + frontend, pre-seeded with a demo
dataset), run from the repository root:

```bash
docker compose -f docker-compose.demo.yml up -d --build
```

Then open [http://localhost:3000](http://localhost:3000) and log in with
`admin` / `admin`.

## Troubleshooting

- **401 responses:** ensure `NEXT_PUBLIC_API_URL` points at the backend and
  the backend `CORS_ORIGINS` includes the frontend origin.
- **Missing artwork:** verify `NEXT_PUBLIC_MEDIA_URL` and the backend
  `ARTWORK_STORAGE_PATH`.
- **Stale build after env changes:** env vars are inlined at build time —
  restart the dev server or rebuild the image.
