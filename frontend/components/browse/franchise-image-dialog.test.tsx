import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { franchisesApi } from "@/lib/api";
import type { Franchise } from "@/lib/types";
import { FranchiseCard } from "./franchise-card";
import { FranchiseImageDialog } from "./franchise-image-dialog";

vi.mock("@/lib/toast", () => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("@/lib/api", () => ({
  franchisesApi: { imageCandidates: vi.fn(), chooseImage: vi.fn(), resetImage: vi.fn(), uploadImage: vi.fn() },
}));

const franchise: Franchise = { id: "f1", name: "Skybound", entry_count: 3, banner_path: null, image_path: "banners/first.jpg" };

describe("FranchiseCard", () => {
  afterEach(cleanup);

  it("shows the franchise's image, chosen or automatic", () => {
    const { container } = render(<FranchiseCard franchise={franchise} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/franchises/f1");
    expect(container.querySelector("img")?.getAttribute("src")).toMatch(/banners\/first\.jpg$/);
    expect(screen.getByText("3 games")).toBeInTheDocument();
  });
});

describe("FranchiseImageDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("offers its games' art and SteamGridDB images, and saves the pick", async () => {
    const user = userEvent.setup();
    const chosen = { ...franchise, banner_path: "franchises/f1/a.jpg", image_path: "franchises/f1/a.jpg" };
    vi.mocked(franchisesApi.imageCandidates).mockResolvedValue(["banners/first.jpg", "https://cdn2.steamgriddb.com/hero.png"]);
    vi.mocked(franchisesApi.chooseImage).mockResolvedValue(chosen);
    const onChanged = vi.fn();
    render(<FranchiseImageDialog franchise={franchise} open onOpenChange={vi.fn()} onChanged={onChanged} />);

    await user.click(await screen.findByRole("button", { name: "Use this image from SteamGridDB" }));

    expect(screen.getByRole("button", { name: "Use this image from one of its games" })).toBeInTheDocument();
    expect(franchisesApi.chooseImage).toHaveBeenCalledWith("f1", "https://cdn2.steamgriddb.com/hero.png");
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(chosen));
  });

  it("goes back to the automatic image only once one was chosen", async () => {
    const user = userEvent.setup();
    vi.mocked(franchisesApi.imageCandidates).mockResolvedValue([]);
    vi.mocked(franchisesApi.resetImage).mockResolvedValue(franchise);
    const { rerender } = render(<FranchiseImageDialog franchise={franchise} open onOpenChange={vi.fn()} onChanged={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Use automatic" })).not.toBeInTheDocument();

    rerender(
      <FranchiseImageDialog franchise={{ ...franchise, banner_path: "franchises/f1/a.jpg" }} open onOpenChange={vi.fn()} onChanged={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "Use automatic" }));

    expect(franchisesApi.resetImage).toHaveBeenCalledWith("f1");
  });
});
