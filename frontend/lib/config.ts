export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  mediaBaseUrl:
    process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:8000/media",
  grafanaUrl:
    process.env.NEXT_PUBLIC_GRAFANA_URL ?? "http://localhost:3000",
} as const;
