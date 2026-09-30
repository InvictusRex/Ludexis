import { getMediaToken } from "@/lib/auth/token-store";
import { config } from "@/lib/config";

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("data:") || /^(https?:)?\/\//.test(path)) {
    return path;
  }

  const url = `${config.mediaBaseUrl}/${path.replace(/^\/+/, "")}`;
  // <img> cannot send an Authorization header, so the URL carries a media-only token.
  const token = getMediaToken();
  return token ? `${url}?media_token=${encodeURIComponent(token)}` : url;
}
