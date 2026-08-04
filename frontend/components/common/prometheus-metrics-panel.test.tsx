import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { PrometheusMetricsPanel } from "./prometheus-metrics-panel";
import { toastError } from "@/lib/toast";

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const METRICS_BODY = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="get",path="/api/health/",status="200"} 12
http_requests_total{method="get",path="/api/health/db",status="200"} 3
ludexis_artwork_downloads_total 2.0
ludexis_metadata_searches_total 5`;

const makeResponse = (body: string, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    text: vi.fn().mockResolvedValue(body),
  }) as unknown as Response;

describe("PrometheusMetricsPanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it("renders the Prometheus text body and the metric line count", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeResponse(METRICS_BODY));

    render(<PrometheusMetricsPanel />);

    expect(
      await screen.findByText(/Total number of HTTP requests/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ludexis_metadata_searches_total/)).toBeInTheDocument();
    expect(screen.getByText("6 metric lines")).toBeInTheDocument();
  });

  it("surfaces quick counters parsed from the metrics body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeResponse(METRICS_BODY));

    render(<PrometheusMetricsPanel />);

    expect(await screen.findByText("HTTP Requests")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Artwork Downloads")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Metadata Searches")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));

    render(<PrometheusMetricsPanel />);

    expect(
      await screen.findByText("Failed to load metrics. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
