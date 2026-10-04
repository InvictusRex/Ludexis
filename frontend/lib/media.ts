import { config } from "@/lib/config";

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("data:") || /^(https?:)?\/\//.test(path)) {
    return path;
  }

  // The session cookie authenticates the image request; no token goes into the URL.
  return `${config.mediaBaseUrl}/${path.replace(/^\/+/, "")}`;
}
