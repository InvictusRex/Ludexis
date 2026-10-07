import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { adminApi, healthApi, jobMonitorApi, jobsApi, scansApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import DashboardOverview from "./page";
import type { AdminStats, JobHistory, User } from "@/lib/types";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  adminApi: { getStats: vi.fn() },
  healthApi: { getHealth: vi.fn(), getDb: vi.fn(), getRedis: vi.fn() },
  jobMonitorApi: { getStats: vi.fn(), getWorkers: vi.fn() },
  jobsApi: { getAll: vi.fn() },
  scansApi: { getStatus: vi.fn(), runFull: vi.fn(), runIncremental: vi.fn() },
}));

const stats: AdminStats = {
  archive_entries: 128,
  collections: 7,
  tags: 42,
  developers: 3,
  publishers: 2,
  franchises: 1,
  users: 4,
  metadata_coverage: 87.5,
  verification_coverage: 30,
};

const finished: JobHistory = {
  id: "job-1",
  job_type: "LIBRARY_SCAN",
  status: "SUCCESS",
  progress: 100,
  started_at: "2026-08-01T00:00:00Z",
};

const running: JobHistory = { id: "job-2", job_type: "METADATA_REFRESH", status: "RUNNING", progress: 40 };

const admin: User = { id: "admin-1", username: "admin", email: "a@example.com", is_active: true, is_superuser: true };

function setup(user: User = admin) {
  vi.mocked(useAuth).mockReturnValue({ user, loading: false, login: vi.fn(), logout: vi.fn() } as any);
  vi.mocked(adminApi.getStats).mockResolvedValue(stats);
  vi.mocked(healthApi.getHealth).mockResolvedValue({ status: "healthy" });
  vi.mocked(healthApi.getDb).mockResolvedValue({ database: "healthy" });
  vi.mocked(healthApi.getRedis).mockRejectedValue(new Error("down"));
  vi.mocked(jobMonitorApi.getStats).mockResolvedValue({ workers: 1, active_tasks: 0, reserved_tasks: 2 });
  vi.mocked(jobMonitorApi.getWorkers).mockResolvedValue({ "celery@box": { ok: "pong" } });
  vi.mocked(scansApi.getStatus).mockResolvedValue({ pending: 0, running: 0, success: 5, failed: 1, canceled: 0, total: 6 });
  vi.mocked(jobsApi.getAll).mockImplementation(async (_type, status) => (status === "RUNNING" ? [running] : [finished, running]));
  render(<DashboardOverview />);
}

describe("DashboardOverview", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows library totals and coverage", async () => {
    setup();
    expect(await screen.findByText("128")).toBeInTheDocument();
    expect(screen.getByText("Games")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("reports each service and the workers", async () => {
    setup();
    const services = await screen.findByRole("list", { name: "Services" });
    await waitFor(() => expect(within(services).getByText("Unreachable")).toBeInTheDocument());
    expect(within(services).getAllByText("Healthy")).toHaveLength(2);
    expect(await screen.findByText("1 online · 0 active · 2 queued")).toBeInTheDocument();
    expect(screen.getByText("celery@box")).toBeInTheDocument();
  });

  it("lists running jobs with progress apart from recent ones", async () => {
    setup();
    expect(await screen.findByRole("progressbar", { name: "Refresh metadata progress" })).toBeInTheDocument();
    const recent = screen.getByRole("list", { name: "Recent jobs" });
    expect(within(recent).getByText("Full library scan")).toBeInTheDocument();
    expect(within(recent).queryByText("Refresh metadata")).not.toBeInTheDocument();
  });

  it("starts a scan for changes", async () => {
    vi.mocked(scansApi.runIncremental).mockResolvedValue({});
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Scan for changes" }));
    await waitFor(() => expect(scansApi.runIncremental).toHaveBeenCalled());
  });

  it("hides admin-only parts and scan buttons from users without those permissions", async () => {
    const editor: User = {
      ...admin,
      is_superuser: false,
      roles: [{ id: "r", name: "Editor", permissions: [{ id: "p", name: "EDIT_METADATA" }] }],
    };
    setup(editor);
    expect(await screen.findByRole("list", { name: "Services" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Scan for changes" })).not.toBeInTheDocument();
    expect(screen.queryByText("Games")).not.toBeInTheDocument();
    expect(adminApi.getStats).not.toHaveBeenCalled();
  });
});
