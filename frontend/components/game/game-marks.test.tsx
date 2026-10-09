import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { GameMarks } from "./game-marks";

vi.mock("@/lib/toast", () => ({ toastError: vi.fn() }));
vi.mock("@/lib/api", () => ({ archiveApi: { setFlags: vi.fn() } }));

const entry = { id: "g1", title: "Quiet Meadow", is_favorite: false, is_completed: true } as ArchiveEntry;

describe("GameMarks", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("toggles favourite and keeps the server's answer", async () => {
    vi.mocked(archiveApi.setFlags).mockResolvedValue({ is_favorite: true, is_completed: true });
    render(<GameMarks entry={entry} />);

    expect(screen.getByRole("button", { name: "Completed" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Add to favourites" }));

    expect(archiveApi.setFlags).toHaveBeenCalledWith("g1", { is_favorite: true });
    await waitFor(() => expect(screen.getByRole("button", { name: "Favourite" })).toHaveAttribute("aria-pressed", "true"));
  });

  it("rolls back when saving fails", async () => {
    vi.mocked(archiveApi.setFlags).mockRejectedValue(new Error("offline"));
    render(<GameMarks entry={entry} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to favourites" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Add to favourites" })).toHaveAttribute("aria-pressed", "false"));
  });
});
