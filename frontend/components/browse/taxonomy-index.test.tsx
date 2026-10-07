import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { developersApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { TaxonomyIndex } from "./taxonomy-index";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/api", () => ({
  developersApi: { getAll: vi.fn() },
  publishersApi: {},
  franchisesApi: {},
  tagsApi: {},
}));

const developers = [
  { id: "d1", name: "Black Lime Games", entry_count: 2 },
  { id: "d2", name: "Arkane", entry_count: 1 },
  { id: "d3", name: "Bethesda", entry_count: 0 },
];

const setup = (isSuperuser: boolean) => {
  vi.mocked(useAuth).mockReturnValue({
    user: { id: "u1", username: "alice", email: "a@b.c", is_active: true, is_superuser: isSuperuser, roles: [] },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(developersApi.getAll).mockResolvedValue({ items: developers, total: developers.length });
  render(<TaxonomyIndex kind="developers" />);
};

describe("TaxonomyIndex", () => {
  afterEach(cleanup);

  it("lists names A–Z under letter headings, linking by id", async () => {
    setup(false);

    const b = await screen.findByRole("region", { name: "B" });
    const links = within(b).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Bethesda0 games", "Black Lime Games2 games"]);
    expect(links[1]).toHaveAttribute("href", "/developers/d1");
    expect(screen.getByText("3 developers")).toBeInTheDocument();
  });

  it("enables only the letters that have entries in the jump bar", async () => {
    setup(false);

    const bar = await screen.findByRole("navigation", { name: "Jump to letter" });
    expect(within(bar).getByRole("link", { name: "A" })).toHaveAttribute("href", "#letter-A");
    expect(within(bar).queryByRole("link", { name: "C" })).not.toBeInTheDocument();
  });

  it("filters by name and offers to clear a filter with no matches", async () => {
    const user = userEvent.setup();
    setup(false);

    const filter = await screen.findByRole("searchbox", { name: "Filter developers" });
    await user.type(filter, "ark");
    expect(screen.getByRole("link", { name: /Arkane/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Bethesda/ })).not.toBeInTheDocument();

    await user.type(filter, "zzz");
    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(screen.getByRole("link", { name: /Bethesda/ })).toBeInTheDocument();
  });

  it("shows the add button only to users who can edit metadata", async () => {
    setup(false);
    await screen.findByRole("region", { name: "A" });
    expect(screen.queryByRole("button", { name: "Add developer" })).not.toBeInTheDocument();
    cleanup();

    setup(true);
    expect(await screen.findByRole("button", { name: "Add developer" })).toBeInTheDocument();
  });
});
