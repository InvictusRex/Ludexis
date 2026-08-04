import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaginationControls } from "./pagination-controls";

describe("PaginationControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when total is less than or equal to pageSize", () => {
    const { container } = render(
      <PaginationControls
        page={1}
        pageSize={25}
        total={25}
        onPageChange={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the page indicator and total count", () => {
    render(
      <PaginationControls
        page={2}
        pageSize={25}
        total={60}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("60 total")).toBeInTheDocument();
  });

  it("disables the previous link on page 1", () => {
    render(
      <PaginationControls
        page={1}
        pageSize={25}
        total={60}
        onPageChange={vi.fn()}
      />,
    );

    const previous = screen.getByRole("link", {
      name: "Go to previous page",
    });
    expect(previous).toHaveAttribute("aria-disabled", "true");

    const next = screen.getByRole("link", { name: "Go to next page" });
    expect(next).not.toHaveAttribute("aria-disabled");
  });

  it("disables the next link on the last page", () => {
    render(
      <PaginationControls
        page={3}
        pageSize={25}
        total={60}
        onPageChange={vi.fn()}
      />,
    );

    const next = screen.getByRole("link", { name: "Go to next page" });
    expect(next).toHaveAttribute("aria-disabled", "true");
  });

  it("fires onPageChange with the previous page", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        page={2}
        pageSize={25}
        total={60}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("link", { name: "Go to previous page" }),
    );

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("fires onPageChange with the next page", async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        page={2}
        pageSize={25}
        total={60}
        onPageChange={onPageChange}
      />,
    );

    await userEvent.click(screen.getByRole("link", { name: "Go to next page" }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
