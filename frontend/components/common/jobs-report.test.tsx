import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { jobsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { JobsReport } from "./jobs-report";
import type { JobHistory } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  jobsApi: {
    getAll: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const makeJob = (overrides: Partial<JobHistory> = {}): JobHistory => ({
  id: "job-1",
  job_type: "LIBRARY_SCAN",
  status: "SUCCESS",
  started_at: "2026-01-01T00:00:00Z",
  completed_at: "2026-01-01T00:00:30Z",
  ...overrides,
});

const jobs: JobHistory[] = [
  makeJob({ id: "j1" }),
  makeJob({
    id: "j2",
    completed_at: "2026-01-01T00:01:30Z",
  }),
  makeJob({
    id: "j3",
    job_type: "METADATA_REFRESH",
    status: "FAILED",
    completed_at: "2026-01-01T00:00:10Z",
  }),
  makeJob({
    id: "j4",
    job_type: "ARTWORK_REFRESH",
    status: "RUNNING",
    completed_at: undefined,
  }),
];

describe("JobsReport", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders totals and completion rate across all recorded jobs", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<JobsReport />);

    expect(await screen.findByText("Total Jobs")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("computes average and median duration for finished jobs", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<JobsReport />);

    expect(await screen.findByText("Avg Duration (Finished)")).toBeInTheDocument();
    expect(screen.getByText("43s")).toBeInTheDocument();
    expect(screen.getByText("Median Duration (Finished)")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("renders a per-job-type breakdown with average durations", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<JobsReport />);

    expect(await screen.findByText("Library Scan")).toBeInTheDocument();
    expect(screen.getByText("Metadata Refresh")).toBeInTheDocument();
    expect(screen.getByText("Artwork Refresh")).toBeInTheDocument();
    expect(screen.getByText("1m")).toBeInTheDocument();
  });

  it("shows an empty state when no jobs have been recorded", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue([]);

    render(<JobsReport />);

    expect(
      await screen.findByText("No job history available"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when the fetch fails", async () => {
    vi.mocked(jobsApi.getAll).mockRejectedValue(new Error("network"));

    render(<JobsReport />);

    expect(
      await screen.findByText("Failed to load job report. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
