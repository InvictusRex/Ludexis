import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { jobsApi, systemApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import DashboardTasks from "./page";
import type { JobHistory, ScheduledTask, User } from "@/lib/types";

const replace = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/admin/tasks",
  useSearchParams: () => search,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  systemApi: {
    getScheduledTasks: vi.fn(),
    updateScheduledTask: vi.fn(),
    runScheduledTask: vi.fn(),
  },
  jobsApi: { getAll: vi.fn(), start: vi.fn(), cancel: vi.fn() },
}));

const task: ScheduledTask = {
  key: "library_scan",
  name: "Scan libraries",
  job_type: "INCREMENTAL_SCAN",
  enabled: true,
  hour: 2,
  minute: 0,
  day_of_week: null,
  last_run_at: null,
  last_job_id: null,
  last_job_status: "SUCCESS",
  next_run_at: "2026-10-07T02:00:00+05:30",
};

const job: JobHistory = { id: "job-1", job_type: "LIBRARY_SCAN", status: "RUNNING", progress: 50 };

const admin: User = { id: "admin-1", username: "admin", email: "a@example.com", is_active: true, is_superuser: true };

function renderPage(user: User = admin) {
  vi.mocked(useAuth).mockReturnValue({ user, loading: false, login: vi.fn(), logout: vi.fn() } as any);
  vi.mocked(systemApi.getScheduledTasks).mockResolvedValue([task]);
  vi.mocked(jobsApi.getAll).mockResolvedValue([job]);
  render(<DashboardTasks />);
}

describe("DashboardTasks", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    search = new URLSearchParams();
  });

  it("lists scheduled tasks with their schedule and last result", async () => {
    renderPage();
    const row = (await screen.findByText("Scan libraries")).closest("tr")!;
    expect(within(row).getByLabelText("Scan libraries time")).toHaveValue("02:00");
    expect(within(row).getByLabelText("Scan libraries frequency")).toHaveValue("-1");
    expect(within(row).getByText("Done")).toBeInTheDocument();
  });

  it("runs a task now", async () => {
    vi.mocked(systemApi.runScheduledTask).mockResolvedValue({ id: "job-9" } as JobHistory);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Run now" }));
    await waitFor(() => expect(systemApi.runScheduledTask).toHaveBeenCalledWith("library_scan"));
  });

  it("saves a new time and frequency", async () => {
    vi.mocked(systemApi.updateScheduledTask).mockResolvedValue({ ...task, hour: 1, minute: 30 });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Scan libraries time"), { target: { value: "01:30" } });
    await waitFor(() =>
      expect(systemApi.updateScheduledTask).toHaveBeenCalledWith("library_scan", { hour: 1, minute: 30 }),
    );
    await waitFor(() => expect(screen.getByLabelText("Scan libraries frequency")).not.toBeDisabled());
    fireEvent.change(screen.getByLabelText("Scan libraries frequency"), { target: { value: "6" } });
    await waitFor(() =>
      expect(systemApi.updateScheduledTask).toHaveBeenCalledWith("library_scan", { day_of_week: 6 }),
    );
  });

  it("opens the job history from ?tab=jobs and cancels a running job", async () => {
    search = new URLSearchParams("tab=jobs");
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.mocked(jobsApi.cancel).mockResolvedValue(job);
    renderPage();
    expect(await screen.findByText("Full library scan")).toBeInTheDocument();
    expect(jobsApi.getAll).toHaveBeenCalledWith(undefined, undefined, 0, 26);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(jobsApi.cancel).toHaveBeenCalledWith("job-1"));
    vi.unstubAllGlobals();
  });

  it("filters jobs by status", async () => {
    search = new URLSearchParams("tab=jobs");
    renderPage();
    fireEvent.change(await screen.findByLabelText("Status"), { target: { value: "FAILED" } });
    await waitFor(() => expect(jobsApi.getAll).toHaveBeenCalledWith(undefined, "FAILED", 0, 26));
  });

  it("shows only job history to users who can run scans but not change schedules", async () => {
    renderPage({
      ...admin,
      is_superuser: false,
      roles: [{ id: "r", name: "Moderator", permissions: [{ id: "p", name: "RUN_SCANS" }] }],
    });
    expect(await screen.findByText("Full library scan")).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Scheduled" })).not.toBeInTheDocument();
    expect(systemApi.getScheduledTasks).not.toHaveBeenCalled();
  });
});
