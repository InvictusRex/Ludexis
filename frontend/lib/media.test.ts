import { describe, expect, it } from "vitest";
import { config } from "@/lib/config";
import { mediaUrl } from "./media";

describe("mediaUrl", () => {
  it("returns undefined for empty paths and leaves absolute URLs alone", () => {
    expect(mediaUrl(null)).toBeUndefined();
    expect(mediaUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });

  it("builds a media URL without any token; the session cookie authenticates it", () => {
    expect(mediaUrl("/covers/a.png")).toBe(`${config.mediaBaseUrl}/covers/a.png`);
  });
});
