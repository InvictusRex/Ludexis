import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { jobsApi } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { BackgroundTaskAnalytics } from "./background-task-analytics";
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
  makeJob({ id: "j2", status: "FAILED", completed_at: "2026-01-01T00:00:05Z" }),
  makeJob({
    id: "j3",
    job_type: "METADATA_REFRESH",
    started_at: "2026-01-02T00:00:00Z",
    completed_at: "2026-01-02T00:10:00Z",
  }),
  makeJob({
    id: "j4",
    job_type: "ARTWORK_REFRESH",
    status: "RUNNING",
    completed_at: undefined,
  }),
];

describe("BackgroundTaskAnalytics", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a job-type by status matrix with counts", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<BackgroundTaskAnalytics />);

    const libraryScanRow = (
      await screen.findByText("Library Scan")
    ).closest("tr");
    expect(libraryScanRow).not.toBeNull();
    const cells = Array.from(libraryScanRow!.querySelectorAll("td")).map(
      (cell) => cell.textContent,
    );
    expect(cells).toEqual(["Library Scan", "1", "1", "0", "0", "0", "2"]);
  });

  it("omits job types with no recorded jobs", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<BackgroundTaskAnalytics />);

    expect(await screen.findByText("Library Scan")).toBeInTheDocument();
    expect(screen.queryByText("Incremental Scan")).not.toBeInTheDocument();
    expect(screen.queryByText("Duplicate Detection")).not.toBeInTheDocument();
  });

  it("highlights the longest running and most recently finished jobs", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue(jobs);

    render(<BackgroundTaskAnalytics />);

    const longest = (await screen.findByText("Longest Running")).closest("div");
    expect(longest).toHaveTextContent("Metadata Refresh");
    expect(longest).toHaveTextContent("10m");

    const recent = screen.getByText("Most Recently Finished").closest("div");
    expect(recent).toHaveTextContent("Metadata Refresh");
  });

  it("shows an empty state when there is no task data", async () => {
    vi.mocked(jobsApi.getAll).mockResolvedValue([]);

    render(<BackgroundTaskAnalytics />);

    expect(
      await screen.findByText("No background task data"),
    ).toBeInTheDocument();
  });

  it("shows a failure state with a Retry button when the fetch fails", async () => {
    vi.mocked(jobsApi.getAll).mockRejectedValue(new Error("network"));

    render(<BackgroundTaskAnalytics />);

    expect(
      await screen.findByText(
        "Failed to load task analytics. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
