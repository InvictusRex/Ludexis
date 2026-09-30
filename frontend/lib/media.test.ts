import { beforeEach, describe, expect, it } from "vitest";
import { setMediaToken, setTokens } from "@/lib/auth/token-store";
import { config } from "@/lib/config";
import { mediaUrl } from "./media";

describe("mediaUrl", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns undefined for empty paths and leaves absolute URLs alone", () => {
    expect(mediaUrl(null)).toBeUndefined();
    expect(mediaUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("adds the media token, never the access token", () => {
    setTokens("access-secret", "refresh-secret");
    setMediaToken("media-only");

    const url = mediaUrl("/covers/a.png");

    expect(url).toBe(`${config.mediaBaseUrl}/covers/a.png?media_token=media-only`);
    expect(url).not.toContain("access-secret");
  });
});
