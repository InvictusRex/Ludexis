import { describe, it, expect } from "vitest";
import { ApiError, getErrorMessage } from "./errors";

describe("ApiError", () => {
  it("extends Error with a name of 'ApiError' and a default status of 0", () => {
    const error = new ApiError("boom");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(0);
  });

  it("carries the status code when provided", () => {
    const error = new ApiError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
  });
});

describe("getErrorMessage", () => {
  it("returns the message from an ApiError instance", () => {
    const error = new ApiError("Request failed", 500);
    expect(getErrorMessage(error)).toBe("Request failed");
  });

  it("returns the message from a generic Error instance", () => {
    const error = new Error("something broke");
    expect(getErrorMessage(error)).toBe("something broke");
  });

  it("returns the default fallback when the Error has no message", () => {
    expect(getErrorMessage(new Error(""))).toBe("Something went wrong");
  });

  it("returns the default fallback for unknown values", () => {
    expect(getErrorMessage("plain string")).toBe("Something went wrong");
    expect(getErrorMessage(null)).toBe("Something went wrong");
    expect(getErrorMessage(undefined)).toBe("Something went wrong");
    expect(getErrorMessage(42)).toBe("Something went wrong");
    expect(getErrorMessage({ code: 500 })).toBe("Something went wrong");
  });

  it("respects a custom fallback string", () => {
    expect(getErrorMessage(null, "custom fallback")).toBe("custom fallback");
    expect(getErrorMessage("oops", "custom fallback")).toBe("custom fallback");
  });
});
