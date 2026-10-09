import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { archiveApi } from "@/lib/api";
import type { ArchiveEntry } from "@/lib/types";
import { ReviewQueue } from "./review-queue";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("@/lib/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  archiveApi: { browse: vi.fn(), update: vi.fn() },
}));

const game = {
  id: "g1",
  title: "Lantern Hollow",
  file_path: "/games/lantern-hollow",
  metadata_status: "UNMATCHED",
  metadata_override: false,
  review_resolved: false,
} as ArchiveEntry;

describe("ReviewQueue", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("marks a game resolved and can show the resolved ones", async () => {
    vi.mocked(archiveApi.browse).mockImplementation(async (query) =>
      query?.metadata_status === "UNMATCHED" && query.review_resolved === false
        ? { items: [game], total: 1 }
        : { items: [], total: 0 },
    );
    vi.mocked(archiveApi.update).mockResolvedValue({ ...game, review_resolved: true });
    const announced = vi.fn();
    window.addEventListener("ludexis:review-changed", announced);
    render(<ReviewQueue />);

    fireEvent.click(await screen.findByRole("button", { name: /mark resolved/i }));
    await waitFor(() => expect(archiveApi.update).toHaveBeenCalledWith("g1", { review_resolved: true }));
    await waitFor(() => expect(announced).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Resolved" }));
    expect(await screen.findByText("No resolved games")).toBeInTheDocument();
    expect(archiveApi.browse).toHaveBeenCalledWith(expect.objectContaining({ review_resolved: true }));
    window.removeEventListener("ludexis:review-changed", announced);
  });
});
