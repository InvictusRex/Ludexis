import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RelationshipVisualizer } from "./relationship-visualizer";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

describe("RelationshipVisualizer", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the header title", () => {
    render(
      <RelationshipVisualizer title="Related Entries" relations={[]} />,
    );

    expect(screen.getByText("Related Entries")).toBeInTheDocument();
  });

  it("renders each relation's label and link with the correct href", () => {
    const relations = [
      { label: "Sequel", title: "Portal 2", href: "/archive/portal-2" },
      { label: "Prequel", title: "Portal", href: "/archive/portal-1" },
    ];

    render(<RelationshipVisualizer title="Relations" relations={relations} />);

    expect(screen.getByText("Sequel")).toBeInTheDocument();
    expect(screen.getByText("Portal 2")).toBeInTheDocument();
    expect(screen.getByText("Prequel")).toBeInTheDocument();
    expect(screen.getByText("Portal")).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/archive/portal-2");
    expect(links[1]).toHaveAttribute("href", "/archive/portal-1");
  });

  it("renders the empty state when relations is empty", () => {
    render(<RelationshipVisualizer title="Relations" relations={[]} />);

    expect(screen.getByText("No relationships yet")).toBeInTheDocument();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
