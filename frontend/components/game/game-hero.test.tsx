import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ArchiveEntry } from "@/lib/types";
import { GameHero } from "./game-hero";

const handlers = {
  onIdentify: vi.fn(),
  onEdit: vi.fn(),
  onManageArtwork: vi.fn(),
  onCopyLink: vi.fn(),
  onToggleHidden: vi.fn(),
  onDelete: vi.fn(),
};

function renderHero(entry: Partial<ArchiveEntry>) {
  render(<GameHero entry={{ id: "g1", title: "Quiet Meadow", ...entry } as ArchiveEntry} versionCount={1} canEdit {...handlers} />);
}

describe("GameHero", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("hides a visible game from the actions menu", async () => {
    const user = userEvent.setup();
    renderHero({ restricted: false });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Hide game" }));
    expect(handlers.onToggleHidden).toHaveBeenCalledOnce();
  });

  it("offers to unhide a hidden game", async () => {
    const user = userEvent.setup();
    renderHero({ restricted: true });

    await user.click(screen.getByRole("button", { name: "More actions" }));
    expect(await screen.findByRole("menuitem", { name: "Unhide game" })).toBeInTheDocument();
  });
});
