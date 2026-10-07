import { describe, expect, it } from "vitest";
import { formatBytes, plural, year } from "./format";

describe("format", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1288490188)).toBe("1.2 GB");
    expect(formatBytes(null)).toBeUndefined();
  });

  it("takes the year from an ISO date and pluralises counts", () => {
    expect(year("2019-04-02")).toBe("2019");
    expect(plural(1, "game")).toBe("1 game");
    expect(plural(1200, "game")).toBe("1,200 games");
  });
});
