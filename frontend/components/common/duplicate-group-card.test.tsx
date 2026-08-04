import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuplicateGroupCard } from "./duplicate-group-card";
import type { DuplicateGroup } from "@/lib/types";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

const makeGroup = (
  overrides: Partial<DuplicateGroup> = {},
): DuplicateGroup => ({
  file_hash: "abc123",
  count: 3,
  entries: [
    { id: "entry-1", title: "Game One", file_path: "/path/one" },
    { id: "entry-2", title: "Game Two", file_path: "/path/two" },
    { id: "entry-3", title: "Game Three", file_path: "/path/three" },
  ],
  ...overrides,
});

const findRow = (title: string) => {
  const text = screen.getByText(title);
  return text.closest("div") as HTMLElement;
};

describe("DuplicateGroupCard", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders each entry's title", () => {
    render(
      <DuplicateGroupCard
        group={makeGroup()}
        onDeleteEntry={vi.fn()}
        onResolve={vi.fn()}
      />,
    );

    expect(screen.getByText("Game One")).toBeInTheDocument();
    expect(screen.getByText("Game Two")).toBeInTheDocument();
    expect(screen.getByText("Game Three")).toBeInTheDocument();
  });

  it("calls onDeleteEntry with the entry id when a row Delete is clicked", async () => {
    const onDeleteEntry = vi.fn();
    render(
      <DuplicateGroupCard
        group={makeGroup()}
        onDeleteEntry={onDeleteEntry}
        onResolve={vi.fn()}
      />,
    );
    const user = userEvent.setup();

    await user.click(within(findRow("Game Two")).getByRole("button", { name: "Delete" }));

    expect(onDeleteEntry).toHaveBeenCalledWith("entry-2");
  });

  it("calls onResolve with the default kept id and the remaining ids", async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);
    render(
      <DuplicateGroupCard
        group={makeGroup()}
        onDeleteEntry={vi.fn()}
        onResolve={onResolve}
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete 2 duplicates" }));

    expect(onResolve).toHaveBeenCalledWith("entry-1", ["entry-2", "entry-3"]);
  });

  it("calls onResolve with the chosen keep id and the remaining ids", async () => {
    const onResolve = vi.fn().mockResolvedValue(undefined);
    render(
      <DuplicateGroupCard
        group={makeGroup()}
        onDeleteEntry={vi.fn()}
        onResolve={onResolve}
      />,
    );
    const user = userEvent.setup();

    await user.click(within(findRow("Game Two")).getByRole("button", { name: "Keep" }));
    await user.click(screen.getByRole("button", { name: "Delete 2 duplicates" }));

    expect(onResolve).toHaveBeenCalledWith("entry-2", ["entry-1", "entry-3"]);
  });
});
