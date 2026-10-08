export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  mediaBaseUrl:
    process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:8000/media",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
} as const;
