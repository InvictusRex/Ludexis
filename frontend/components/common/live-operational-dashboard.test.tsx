import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { healthApi, jobMonitorApi, scansApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { LiveOperationalDashboard } from "./live-operational-dashboard";

const POLL_MS = 20;

vi.mock("@/lib/api", () => ({
  healthApi: {
    getHealth: vi.fn(),
    getDb: vi.fn(),
    getRedis: vi.fn(),
  },
  jobMonitorApi: {
    getStats: vi.fn(),
  },
  scansApi: {
    getStatus: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const mockHealthy = () => {
  vi.mocked(healthApi.getHealth).mockResolvedValue({ status: "ok" });
  vi.mocked(healthApi.getDb).mockResolvedValue({ database: "ok" });
  vi.mocked(healthApi.getRedis).mockResolvedValue({ redis: "pong" });
  vi.mocked(jobMonitorApi.getStats).mockResolvedValue({
    workers: 2,
    active_tasks: 3,
    reserved_tasks: 1,
  });
  vi.mocked(scansApi.getStatus).mockResolvedValue({
    pending: 4,
    running: 5,
    success: 10,
    failed: 1,
    canceled: 0,
    total: 20,
  });
};

describe("LiveOperationalDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the service status grid and workload counters", async () => {
    mockHealthy();

    render(<LiveOperationalDashboard />);

    expect(await screen.findByText("API")).toBeInTheDocument();
    expect(screen.getAllByText("healthy")).toHaveLength(3);
    expect(screen.getByText("Workers")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Active Tasks")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Pending Scans")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Running Scans")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("marks a failing dependency as unhealthy", async () => {
    mockHealthy();
    vi.mocked(healthApi.getRedis).mockResolvedValue({ redis: "unavailable" });

    render(<LiveOperationalDashboard />);

    expect(await screen.findByText("unhealthy")).toBeInTheDocument();
    expect(screen.getAllByText("healthy")).toHaveLength(2);
  });

  it("does not poll while live updates are off", async () => {
    mockHealthy();

    render(<LiveOperationalDashboard pollIntervalMs={POLL_MS} />);

    await screen.findByText("API");
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, POLL_MS * 5));
    expect(healthApi.getHealth).toHaveBeenCalledTimes(1);
  });

  it("polls on an interval and shows a LIVE badge when enabled", async () => {
    mockHealthy();
    const user = userEvent.setup();

    render(<LiveOperationalDashboard pollIntervalMs={POLL_MS} />);

    await screen.findByText("API");
    await user.click(screen.getByRole("switch"));

    expect(screen.getByText("LIVE")).toBeInTheDocument();
    await waitFor(() =>
      expect(healthApi.getHealth).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(healthApi.getHealth).toHaveBeenCalledTimes(3),
    );
  });

  it("stops polling on unmount", async () => {
    mockHealthy();
    const user = userEvent.setup();

    const { unmount } = render(
      <LiveOperationalDashboard pollIntervalMs={POLL_MS} />,
    );

    await screen.findByText("API");
    await user.click(screen.getByRole("switch"));
    unmount();

    const callsAtUnmount = vi.mocked(healthApi.getHealth).mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, POLL_MS * 5));
    expect(healthApi.getHealth).toHaveBeenCalledTimes(callsAtUnmount);
  });

  it("accumulates trend samples that feed the trend visualization", async () => {
    mockHealthy();
    const user = userEvent.setup();

    render(<LiveOperationalDashboard pollIntervalMs={POLL_MS} />);

    await screen.findByText("API");
    expect(screen.getByText("Not enough samples yet")).toBeInTheDocument();

    await user.click(screen.getByRole("switch"));

    expect(
      await screen.findByLabelText("API Availability trend"),
    ).toBeInTheDocument();
  });

  it("shows an error state and toasts when the snapshot fetch fails", async () => {
    vi.mocked(healthApi.getHealth).mockRejectedValue(new Error("network"));
    vi.mocked(healthApi.getDb).mockRejectedValue(new Error("network"));
    vi.mocked(healthApi.getRedis).mockRejectedValue(new Error("network"));
    vi.mocked(jobMonitorApi.getStats).mockRejectedValue(new Error("network"));
    vi.mocked(scansApi.getStatus).mockRejectedValue(new Error("network"));

    render(<LiveOperationalDashboard />);

    expect(
      await screen.findByText(
        "Failed to load live operational data. Please try again.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
