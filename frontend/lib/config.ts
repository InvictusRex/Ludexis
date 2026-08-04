export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  mediaBaseUrl:
    process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:8000/media",
} as const;
