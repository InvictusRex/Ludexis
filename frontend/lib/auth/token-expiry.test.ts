import { describe, it, expect } from "vitest";
import {
  decodeJwtPayload,
  getTokenExpiry,
  isExpired,
  msUntilExpiry,
} from "./token-expiry";

const base64Url = (input: string) =>
  btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const makeJwt = (payload: unknown) =>
  `header.${base64Url(JSON.stringify(payload))}.signature`;

describe("decodeJwtPayload", () => {
  it("decodes a valid base64url JWT payload", () => {
    const payload = { sub: "user-1", exp: 1700000000, role: "admin" };

    expect(decodeJwtPayload(makeJwt(payload))).toEqual(payload);
  });

  it("returns null for null or undefined input", () => {
    expect(decodeJwtPayload(null)).toBeNull();
    expect(decodeJwtPayload(undefined)).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(decodeJwtPayload("garbage")).toBeNull();
    expect(decodeJwtPayload("a.b")).toBeNull();
    expect(decodeJwtPayload("a.b!c.signature")).toBeNull();
    expect(decodeJwtPayload("a.{not-json}.c")).toBeNull();
  });

  it("returns null when the decoded payload is not an object", () => {
    expect(decodeJwtPayload(makeJwt("not-an-object"))).toBeNull();
  });
});

describe("getTokenExpiry", () => {
  it("converts exp seconds to milliseconds epoch", () => {
    const payload = { exp: 1700000000 };

    expect(getTokenExpiry(makeJwt(payload))).toBe(1700000000000);
  });

  it("returns null when the token cannot be decoded", () => {
    expect(getTokenExpiry(null)).toBeNull();
    expect(getTokenExpiry("garbage")).toBeNull();
  });

  it("returns null when exp is missing or not a number", () => {
    expect(getTokenExpiry(makeJwt({}))).toBeNull();
    expect(getTokenExpiry(makeJwt({ exp: "1700000000" }))).toBeNull();
  });
});

describe("isExpired", () => {
  const expiry = 1000;

  it("returns false while there is time remaining", () => {
    expect(isExpired(expiry, 999)).toBe(false);
  });

  it("returns true exactly at the expiry boundary", () => {
    expect(isExpired(expiry, 1000)).toBe(true);
  });

  it("returns true once past the expiry", () => {
    expect(isExpired(expiry, 1001)).toBe(true);
  });
});

describe("msUntilExpiry", () => {
  it("returns positive remaining time", () => {
    expect(msUntilExpiry(5000, 1000)).toBe(4000);
  });

  it("returns zero at the expiry boundary", () => {
    expect(msUntilExpiry(1000, 1000)).toBe(0);
  });

  it("returns a negative value once past expiry", () => {
    expect(msUntilExpiry(1000, 2000)).toBe(-1000);
  });
});
