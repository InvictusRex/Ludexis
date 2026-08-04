import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  ArtworkQualityIndicators,
  buildQualityChecks,
} from "./artwork-quality-indicators";
import type { ArchiveEntry } from "@/lib/types";

const makeEntry = (overrides: Partial<ArchiveEntry> = {}): ArchiveEntry => ({
  id: "entry-1",
  title: "Portal",
  file_path: "/archive/portal.zip",
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

const fullEntry = makeEntry({
  cover_path: "covers/portal.png",
  banner_path: "banners/portal.png",
  logo_path: "logos/portal.png",
  metadata_confidence: 0.95,
});

describe("buildQualityChecks", () => {
  it("weights every artwork and metadata signal to a total of 100", () => {
    const total = buildQualityChecks(makeEntry()).reduce(
      (sum, check) => sum + check.weight,
      0,
    );
    expect(total).toBe(100);
  });

  it("passes each check when the corresponding data is present", () => {
    const checks = buildQualityChecks(fullEntry, 3);
    expect(checks.every((check) => check.passed)).toBe(true);
  });
});

describe("ArtworkQualityIndicators", () => {
  afterEach(() => {
    cleanup();
  });

  it("scores a fully populated entry as excellent", () => {
    render(<ArtworkQualityIndicators entry={fullEntry} screenshotCount={3} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(screen.getByText("3 screenshots")).toBeInTheDocument();
  });

  it("scores an entry with no artwork as needing attention", () => {
    render(
      <ArtworkQualityIndicators
        entry={makeEntry({
          metadata_status: "UNMATCHED",
          verification_status: "MISSING",
        })}
      />,
    );

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getAllByText("Missing")).toHaveLength(3);
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("scores a partially populated entry as good", () => {
    render(
      <ArtworkQualityIndicators
        entry={makeEntry({
          cover_path: "covers/portal.png",
          metadata_confidence: 0.9,
        })}
      />,
    );

    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
  });

  it("renders a checklist row for every quality signal", () => {
    render(<ArtworkQualityIndicators entry={fullEntry} screenshotCount={1} />);

    expect(screen.getByText("Cover art")).toBeInTheDocument();
    expect(screen.getByText("Banner art")).toBeInTheDocument();
    expect(screen.getByText("Logo art")).toBeInTheDocument();
    expect(screen.getByText("Screenshots")).toBeInTheDocument();
    expect(screen.getByText("Metadata matched")).toBeInTheDocument();
    expect(screen.getByText("High match confidence")).toBeInTheDocument();
    expect(screen.getByText("File verified")).toBeInTheDocument();
  });

  it("fails the confidence check below the 70% threshold", () => {
    render(
      <ArtworkQualityIndicators
        entry={makeEntry({ metadata_confidence: 0.4 })}
      />,
    );

    expect(screen.getByText("40%")).toBeInTheDocument();
    const checks = buildQualityChecks(makeEntry({ metadata_confidence: 0.4 }));
    const confidence = checks.find(
      (check) => check.label === "High match confidence",
    );
    expect(confidence?.passed).toBe(false);
  });
});
