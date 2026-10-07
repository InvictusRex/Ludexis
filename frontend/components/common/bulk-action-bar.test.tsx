import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkActionBar } from "./bulk-action-bar";

const noop = () => {};

describe("BulkActionBar", () => {
  afterEach(cleanup);

  it("shows how many games are selected", () => {
    render(<BulkActionBar selectedCount={3} onDelete={noop} onAddToCollection={noop} onClear={noop} />);

    expect(screen.getByRole("region", { name: "Selected games" })).toHaveTextContent("3 games selected");
  });

  it("renders nothing when nothing is selected", () => {
    const { container } = render(<BulkActionBar selectedCount={0} onDelete={noop} onClear={noop} />);

    expect(container.firstChild).toBeNull();
  });

  it("runs each action", async () => {
    const onDelete = vi.fn();
    const onAddToCollection = vi.fn();
    const onClear = vi.fn();
    render(
      <BulkActionBar selectedCount={1} onDelete={onDelete} onAddToCollection={onAddToCollection} onClear={onClear} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Add to collection" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onAddToCollection).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("hides the actions the user may not run", () => {
    render(<BulkActionBar selectedCount={2} onAddToCollection={noop} onClear={noop} />);

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to collection" })).toBeInTheDocument();
  });
});
