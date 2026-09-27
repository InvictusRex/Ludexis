import { getAccessToken } from "@/lib/auth/token-store";
import { config } from "@/lib/config";

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("data:") || /^(https?:)?\/\//.test(path)) {
    return path;
  }

  const url = `${config.mediaBaseUrl}/${path.replace(/^\/+/, "")}`;
  // <img> cannot send an Authorization header; the media route accepts the token as a query parameter.
  const token = getAccessToken();
  return token ? `${url}?access_token=${encodeURIComponent(token)}` : url;
}
