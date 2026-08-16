import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CollectionStats, formatFileSize } from "./collection-stats";
import type { ArchiveEntry } from "@/lib/types";

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "entry-1",
  title: "Entry",
  file_path: "/archive/entry.zip",
  metadata_status: "MATCHED",
  metadata_override: false,
  verification_status: "VERIFIED",
  related_entry_ids: [],
  tag_ids: [],
  developer_ids: [],
  publisher_ids: [],
  collection_ids: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

const entries: ArchiveEntry[] = [
  makeEntry({ id: "e1", file_size: 1024 * 1024, cover_path: "covers/a.png" }),
  makeEntry({ id: "e2", file_size: 1024 * 1024, verification_status: "MISSING" }),
  makeEntry({
    id: "e3",
    file_size: 2 * 1024 * 1024,
    metadata_status: "UNMATCHED",
    verification_status: "UNKNOWN",
    cover_path: "covers/c.png",
  }),
  makeEntry({ id: "e4", verification_status: "MOVED" }),
];

describe("formatFileSize", () => {
  it("formats byte counts into human-readable units", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1024)).toBe("1.00 KB");
    expect(formatFileSize(4 * 1024 * 1024)).toBe("4.00 MB");
    expect(formatFileSize(1024 ** 3 * 1.5)).toBe("1.50 GB");
  });
});

describe("CollectionStats", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the entry count and summed total size", () => {
    render(<CollectionStats entries={entries} />);

    expect(screen.getByText("Total Entries")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Total Size")).toBeInTheDocument();
    expect(screen.getByText("4.00 MB")).toBeInTheDocument();
  });

  it("computes metadata and artwork coverage percentages", () => {
    render(<CollectionStats entries={entries} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("3 of 4 matched")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("2 of 4 with cover art")).toBeInTheDocument();
  });

  it("renders a verification breakdown row for every status", () => {
    render(<CollectionStats entries={entries} />);

    expect(screen.getByText("VERIFIED")).toBeInTheDocument();
    expect(screen.getByText("MISSING")).toBeInTheDocument();
    expect(screen.getByText("MOVED")).toBeInTheDocument();
    expect(screen.getByText("CORRUPTED")).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();

    expect(screen.getAllByText("1 · 25%")).toHaveLength(4);
    expect(screen.getByText("0 · 0%")).toBeInTheDocument();
  });

  it("renders zeroed stats for an empty collection without dividing by zero", () => {
    render(<CollectionStats entries={[]} />);

    expect(screen.getByText("0 B")).toBeInTheDocument();
    expect(screen.getByText("0 of 0 matched")).toBeInTheDocument();
    expect(screen.getAllByText("0 · 0%")).toHaveLength(5);
  });
});
