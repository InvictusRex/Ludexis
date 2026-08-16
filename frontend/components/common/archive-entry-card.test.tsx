import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ArchiveEntryCard } from "./archive-entry-card";
import type { ArchiveEntry, VerificationStatus } from "@/lib/types";

vi.mock("next/link", () => ({
  default: (props: any) => <a href={props.href}>{props.children}</a>,
}));

const makeEntry = (
  overrides: Partial<Omit<ArchiveEntry, "cover_path">> & { cover_path?: string | null } = {},
): ArchiveEntry => ({
  id: "entry-1",
  title: "Test Game",
  file_path: "/path/to/game",
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "UNKNOWN",
  related_entry_ids: [],
  tag_ids: [],
  developer_ids: [],
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
} as unknown as ArchiveEntry);

describe("ArchiveEntryCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and the No Cover placeholder when cover_path is null", () => {
    render(
      <ArchiveEntryCard
        entry={makeEntry({ cover_path: null, verification_status: "VERIFIED" })}
      />,
    );

    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(screen.getByText("No Cover")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders an img with the cover_path as its src when cover_path is set", () => {
    render(
      <ArchiveEntryCard
        entry={makeEntry({ cover_path: "/covers/entry-1.jpg" })}
      />,
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "http://localhost:8000/media/covers/entry-1.jpg");
    expect(screen.queryByText("No Cover")).not.toBeInTheDocument();
  });

  it.each<[VerificationStatus, string]>([
    ["VERIFIED", "bg-green-900"],
    ["MISSING", "bg-red-900"],
    ["MOVED", "bg-amber-900"],
    ["UNKNOWN", "bg-gray-900"],
  ])(
    "renders a verification badge with the %s status color",
    (status, colorClass) => {
      render(<ArchiveEntryCard entry={makeEntry({ verification_status: status })} />);

      expect(screen.getAllByText(status).length).toBeGreaterThan(0);

      const badge = screen.getAllByText(status)[0].closest("[data-slot=\"badge\"]");
      expect(badge).not.toBeNull();
      expect(badge!.className).toContain(colorClass);
    },
  );

  it("links to /archive/{id}", () => {
    render(
      <ArchiveEntryCard
        entry={makeEntry({ id: "abc-123", verification_status: "VERIFIED" })}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/archive/abc-123");
  });
});
