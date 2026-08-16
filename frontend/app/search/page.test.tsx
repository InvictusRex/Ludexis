import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { searchApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import SearchPage from "./page";
import type { ArchiveEntry, SearchResults, User } from "@/lib/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  searchApi: {
    search: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  toastInfo: vi.fn(),
}));

const makeUser = (): User => ({
  id: "u1",
  username: "alice",
  email: "alice@example.com",
  is_active: true,
  is_superuser: false,
});

const mockAuth = () => {
  vi.mocked(useAuth).mockReturnValue({
    user: makeUser(),
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
};

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "e1",
  title: "Portal",
  file_path: "/archive/portal.zip",
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "VERIFIED",
  related_entry_ids: [],
  tag_ids: [],
  developer_ids: [],
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const makeResults = (entries: ArchiveEntry[]): SearchResults => ({
  total: entries.length,
  entries,
  collections: [],
  developers: [],
  publishers: [],
  tags: [],
  franchises: [],
});

describe("SearchPage advanced builder", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("hides the builder until Advanced is toggled", async () => {
    mockAuth();
    vi.mocked(searchApi.search).mockResolvedValue(makeResults([]));
    const user = userEvent.setup();

    render(<SearchPage />);

    expect(
      screen.queryByText("Advanced Search Builder"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /advanced/i }));

    expect(screen.getByText("Advanced Search Builder")).toBeInTheDocument();
  });

  it("applies a built condition to the search filters", async () => {
    mockAuth();
    vi.mocked(searchApi.search).mockResolvedValue(
      makeResults([makeEntry()]),
    );
    const user = userEvent.setup();

    render(<SearchPage />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    await user.click(screen.getByRole("button", { name: /add condition/i }));

    await user.click(screen.getByLabelText("Condition 1 field"));
    await user.click(await screen.findByRole("option", { name: "Developer" }));
    await user.type(screen.getByLabelText("Condition 1 value"), "Valve");
    await user.type(screen.getByLabelText("Search archive"), "portal");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    await waitFor(() =>
      expect(searchApi.search).toHaveBeenCalledWith(
        "portal",
        expect.objectContaining({ developers: ["Valve"] }),
      ),
    );
  });

  it("fills the keyword box from a query condition and searches", async () => {
    mockAuth();
    vi.mocked(searchApi.search).mockResolvedValue(
      makeResults([makeEntry()]),
    );
    const user = userEvent.setup();

    render(<SearchPage />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.type(screen.getByLabelText("Condition 1 value"), "portal");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(screen.getByLabelText("Search archive")).toHaveValue("portal");
    await waitFor(() =>
      expect(searchApi.search).toHaveBeenCalledWith(
        "portal",
        expect.anything(),
      ),
    );
  });

  it("excludes entries matching a not-equals condition", async () => {
    mockAuth();
    vi.mocked(searchApi.search).mockResolvedValue(
      makeResults([
        makeEntry({ id: "e1", title: "Portal" }),
        makeEntry({
          id: "e2",
          title: "Half-Life",
          verification_status: "MISSING",
        }),
      ]),
    );
    const user = userEvent.setup();

    render(<SearchPage />);

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    await user.click(screen.getByRole("button", { name: /add condition/i }));

    await user.click(screen.getByLabelText("Condition 1 field"));
    await user.click(
      await screen.findByRole("option", { name: "Verification Status" }),
    );
    await user.click(screen.getByLabelText("Condition 1 operator"));
    await user.click(
      await screen.findByRole("option", { name: "does not equal" }),
    );
    await user.click(screen.getByLabelText("Condition 1 value"));
    await user.click(await screen.findByRole("option", { name: "MISSING" }));

    await user.type(screen.getByLabelText("Search archive"), "a");
    await user.click(screen.getByRole("button", { name: /^apply$/i }));

    expect(await screen.findByText("Portal")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Half-Life")).not.toBeInTheDocument(),
    );
  });
});
