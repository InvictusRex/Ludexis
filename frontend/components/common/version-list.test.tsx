import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { VersionList } from "./version-list";
import type { ArchiveEntry } from "@/lib/types";

const version = (id: string, value: string | null, size: number) =>
  ({
    id,
    version: value,
    file_path: `/games/meadow-${id}.zip`,
    file_size: size,
    verification_status: "VERIFIED",
    created_at: "2026-01-01T00:00:00Z",
  }) as ArchiveEntry;

describe("VersionList", () => {
  afterEach(cleanup);

  it("lists every version with its path, size and status and marks the current one", () => {
    render(
      <VersionList versions={[version("b", "0.10", 3 * 1024 * 1024), version("a", null, 1024 * 1024)]} currentId="b" />,
    );

    expect(screen.getByText("v0.10")).toBeInTheDocument();
    expect(screen.getByText("Unversioned")).toBeInTheDocument();
    expect(screen.getByText("/games/meadow-b.zip")).toBeInTheDocument();
    expect(screen.getByText("3.0 MB")).toBeInTheDocument();
    expect(screen.getAllByText("File verified")).toHaveLength(2);
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/archive/b");
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[1]).not.toHaveAttribute("aria-current");
  });

  it("renders nothing for a game with one version", () => {
    const { container } = render(<VersionList versions={[version("a", "1.0", 1)]} currentId="a" />);
    expect(container).toBeEmptyDOMElement();
  });
});
