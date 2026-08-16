import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

describe("ErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>ok</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders the default fallback when a child throws", () => {
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const Boom = () => {
      throw new Error("boom");
    };

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
  });

  it("renders the custom fallback prop when a child throws", () => {
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const Boom = () => {
      throw new Error("boom");
    };

    render(
      <ErrorBoundary fallback={<div>custom fallback</div>}>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText("custom fallback")).toBeInTheDocument();
  });

  it("recovers after remount with a new key", () => {
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const Boom = () => {
      throw new Error("boom");
    };

    const { rerender } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    rerender(
      <ErrorBoundary key="reset">
        <div>ok</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("ok")).toBeInTheDocument();
  });
});
