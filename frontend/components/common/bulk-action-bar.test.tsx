import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionBar } from "./bulk-action-bar";

const noop = () => {};

describe("BulkActionBar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the selected count", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        onDelete={noop}
        onAddToCollection={noop}
        onClear={noop}
      />,
    );

    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        onDelete={noop}
        onAddToCollection={noop}
        onClear={noop}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("calls onDelete when Delete is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onDelete={onDelete}
        onAddToCollection={noop}
        onClear={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onAddToCollection when Add to collection is clicked", async () => {
    const onAddToCollection = vi.fn();
    render(
      <BulkActionBar
        selectedCount={2}
        onDelete={noop}
        onAddToCollection={onAddToCollection}
        onClear={noop}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Add to collection" }),
    );

    expect(onAddToCollection).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when Clear is clicked", async () => {
    const onClear = vi.fn();
    render(
      <BulkActionBar
        selectedCount={1}
        onDelete={noop}
        onAddToCollection={noop}
        onClear={onClear}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
