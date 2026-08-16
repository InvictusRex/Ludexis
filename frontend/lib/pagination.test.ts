import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  buildPageQuery,
  hasMore,
  pageToOffset,
} from "./pagination";

describe("pageToOffset", () => {
  it("maps page 1 to offset 0", () => {
    expect(pageToOffset(1, 25)).toBe(0);
  });

  it("maps page 2 to offset 25", () => {
    expect(pageToOffset(2, 25)).toBe(25);
  });

  it("maps page 3 to offset 100 when the limit is 50", () => {
    expect(pageToOffset(3, 50)).toBe(100);
  });
});

describe("buildPageQuery", () => {
  it("builds an offset/limit query for the first page", () => {
    expect(buildPageQuery(1, 25)).toEqual({ offset: 0, limit: 25 });
  });

  it("builds an offset/limit query for a later page", () => {
    expect(buildPageQuery(4, 50)).toEqual({ offset: 150, limit: 50 });
  });
});

describe("hasMore", () => {
  it("returns true when the count fills the page", () => {
    expect(hasMore(25, 25)).toBe(true);
  });

  it("returns false when the count is below the limit", () => {
    expect(hasMore(10, 25)).toBe(false);
  });

  it("returns false when the count is zero", () => {
    expect(hasMore(0, 25)).toBe(false);
  });
});

describe("constants", () => {
  it("exposes a default page size of 25", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(25);
  });

  it("exposes ascending page sizes", () => {
    expect(PAGE_SIZES).toEqual([10, 25, 50, 100]);
  });
});
