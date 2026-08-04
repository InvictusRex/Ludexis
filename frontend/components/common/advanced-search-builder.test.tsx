import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvancedSearchBuilder } from "./advanced-search-builder";

describe("AdvancedSearchBuilder", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts empty with Apply disabled", () => {
    render(<AdvancedSearchBuilder onApply={vi.fn()} />);

    expect(
      screen.getByText("No conditions yet. Add one to start building a query."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeDisabled();
  });

  it("adds a condition row when Add condition is clicked", async () => {
    const user = userEvent.setup();

    render(<AdvancedSearchBuilder onApply={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /add condition/i }));

    expect(screen.getByLabelText("Condition 1 field")).toBeInTheDocument();
    expect(screen.getByLabelText("Condition 1 operator")).toBeInTheDocument();
    expect(screen.getByLabelText("Condition 1 value")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeEnabled();
  });

  it("passes the typed conditions to onApply", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(<AdvancedSearchBuilder onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.type(screen.getByLabelText("Condition 1 value"), "portal");
    await user.click(screen.getByRole("button", { name: /apply/i }));

    expect(onApply).toHaveBeenCalledWith([
      { field: "query", operator: "contains", value: "portal" },
    ]);
  });

  it("removes a condition row and reindexes the remaining rows", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(<AdvancedSearchBuilder onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.type(screen.getByLabelText("Condition 1 value"), "first");
    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.type(screen.getByLabelText("Condition 2 value"), "second");

    await user.click(
      screen.getByRole("button", { name: "Remove condition 1" }),
    );

    expect(screen.queryByLabelText("Condition 2 value")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Condition 1 value")).toHaveValue("second");

    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith([
      { field: "query", operator: "contains", value: "second" },
    ]);
  });

  it("renders initial conditions supplied by the caller", () => {
    render(
      <AdvancedSearchBuilder
        onApply={vi.fn()}
        initial={[
          { field: "developer", operator: "equals", value: "Valve" },
          { field: "tag", operator: "not-equals", value: "beta" },
        ]}
      />,
    );

    expect(screen.getByLabelText("Condition 1 value")).toHaveValue("Valve");
    expect(screen.getByLabelText("Condition 2 value")).toHaveValue("beta");
  });

  it("offers a fixed value list for status fields", async () => {
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onApply={vi.fn()}
        initial={[
          { field: "verificationStatus", operator: "equals", value: "" },
        ]}
      />,
    );

    await user.click(screen.getByLabelText("Condition 1 value"));

    expect(
      await screen.findByRole("option", { name: "VERIFIED" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "CORRUPTED" })).toBeInTheDocument();
  });

  it("clears the value when the field changes", async () => {
    const onApply = vi.fn();
    const user = userEvent.setup();

    render(
      <AdvancedSearchBuilder
        onApply={onApply}
        initial={[{ field: "developer", operator: "equals", value: "Valve" }]}
      />,
    );

    await user.click(screen.getByLabelText("Condition 1 field"));
    await user.click(await screen.findByRole("option", { name: "Publisher" }));

    await user.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith([
      { field: "publisher", operator: "equals", value: "" },
    ]);
  });
});
