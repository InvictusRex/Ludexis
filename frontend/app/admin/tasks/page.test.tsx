import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { systemApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import ScheduledTasksPage from "./page";
import type { ScheduledTask } from "@/lib/types";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

describe("ScheduledTasksPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderPage = () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "admin-1", username: "admin", email: "a@example.com", is_active: true, is_superuser: true },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
    vi.mocked(systemApi.getScheduledTasks).mockResolvedValue([task]);
    render(<ScheduledTasksPage />);
  };

  it("lists tasks with their schedule and last result", async () => {
    renderPage();
    expect(await screen.findByText("Scan libraries")).toBeInTheDocument();
    expect(screen.getByLabelText("Scan libraries time")).toHaveValue("02:00");
    expect(screen.getByLabelText("Scan libraries frequency")).toHaveValue("-1");
    expect(screen.getByText("SUCCESS")).toBeInTheDocument();
  });

  it("runs a task now", async () => {
    vi.mocked(systemApi.runScheduledTask).mockResolvedValue({ id: "job-9" } as any);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /run now/i }));
    await waitFor(() => expect(systemApi.runScheduledTask).toHaveBeenCalledWith("library_scan"));
  });

  it("saves a new time and frequency", async () => {
    vi.mocked(systemApi.updateScheduledTask).mockResolvedValue({ ...task, hour: 1, minute: 30 });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Scan libraries time"), { target: { value: "01:30" } });
    await waitFor(() =>
      expect(systemApi.updateScheduledTask).toHaveBeenCalledWith("library_scan", { hour: 1, minute: 30 }),
    );
    fireEvent.change(screen.getByLabelText("Scan libraries frequency"), { target: { value: "6" } });
    await waitFor(() =>
      expect(systemApi.updateScheduledTask).toHaveBeenCalledWith("library_scan", { day_of_week: 6 }),
    );
  });
});
