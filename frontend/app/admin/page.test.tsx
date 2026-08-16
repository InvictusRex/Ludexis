import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { adminApi, jobsApi, scansApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import AdminDashboard from "./page";
import type { AdminStats, JobHistory, User } from "@/lib/types";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  adminApi: {
    getStats: vi.fn(),
    getRecentJobs: vi.fn(),
  },
  jobsApi: {
    start: vi.fn(),
  },
  scansApi: {
    runFull: vi.fn(),
  },
}));

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: "admin-1",
  username: "admin",
  email: "admin@example.com",
  is_active: true,
  is_superuser: true,
  ...overrides,
});

const mockAuth = (user: User | null, loading = false) => {
  vi.mocked(useAuth).mockReturnValue({
    user,
    loading,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

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

const job: JobHistory = {
  id: "job-1",
  job_type: "LIBRARY_SCAN",
  status: "SUCCESS",
  progress: 100,
  started_at: "2026-08-01T00:00:00Z",
};

describe("AdminDashboard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the dashboard heading", async () => {
    vi.mocked(adminApi.getStats).mockResolvedValue(stats);
    vi.mocked(adminApi.getRecentJobs).mockResolvedValue([]);
    mockAuth(makeUser());

    render(<AdminDashboard />);

    expect(
      await screen.findByRole("heading", { name: "Administration Dashboard" }),
    ).toBeInTheDocument();
  });

  it("renders stat cards with values from the mocked stats", async () => {
    vi.mocked(adminApi.getStats).mockResolvedValue(stats);
    vi.mocked(adminApi.getRecentJobs).mockResolvedValue([]);
    mockAuth(makeUser());

    render(<AdminDashboard />);

    expect(await screen.findByText("128")).toBeInTheDocument();
    expect(screen.getByText("Total Entries")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
  });

  it("renders recent jobs from the mocked jobs API", async () => {
    vi.mocked(adminApi.getStats).mockResolvedValue(stats);
    vi.mocked(adminApi.getRecentJobs).mockResolvedValue([job]);
    mockAuth(makeUser());

    render(<AdminDashboard />);

    expect(await screen.findByText("Full Scan")).toBeInTheDocument();
    expect(screen.getByText("Recent Jobs")).toBeInTheDocument();
  });

  it("renders an error message when stats reject", async () => {
    vi.mocked(adminApi.getStats).mockRejectedValue(new Error("network"));
    vi.mocked(adminApi.getRecentJobs).mockResolvedValue([]);
    mockAuth(makeUser());

    render(<AdminDashboard />);

    expect(
      await screen.findByText("Failed to load admin dashboard data."),
    ).toBeInTheDocument();
  });
});
