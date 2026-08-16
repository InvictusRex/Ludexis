import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  TrendVisualization,
  type TrendSample,
} from "./trend-visualization";

const makeSample = (overrides: Partial<TrendSample> = {}): TrendSample => ({
  apiHealthy: true,
  dbHealthy: true,
  redisHealthy: true,
  pendingJobs: 0,
  runningJobs: 0,
  activeTasks: 0,
  ...overrides,
});

describe("TrendVisualization", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows an empty state until at least two samples exist", () => {
    const { rerender } = render(<TrendVisualization samples={[]} />);

    expect(screen.getByText("Not enough samples yet")).toBeInTheDocument();

    rerender(<TrendVisualization samples={[makeSample()]} />);
    expect(screen.getByText("Not enough samples yet")).toBeInTheDocument();
  });

  it("renders one sparkline per series once samples are collected", () => {
    render(
      <TrendVisualization
        samples={[
          makeSample({ runningJobs: 1 }),
          makeSample({ runningJobs: 3 }),
        ]}
      />,
    );

    expect(screen.getByLabelText("API Availability trend")).toBeInTheDocument();
    expect(screen.getByLabelText("Running Jobs trend")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(6);
  });

  it("plots normalized polyline points for a count series", () => {
    render(
      <TrendVisualization
        samples={[
          makeSample({ activeTasks: 0 }),
          makeSample({ activeTasks: 2 }),
          makeSample({ activeTasks: 4 }),
        ]}
      />,
    );

    const svg = screen.getByLabelText("Active Tasks trend");
    const polyline = svg.querySelector("polyline");
    expect(polyline?.getAttribute("points")).toBe(
      "0.00,30.00 50.00,15.00 100.00,0.00",
    );
  });

  it("reports the latest value and peak for count series", () => {
    render(
      <TrendVisualization
        samples={[
          makeSample({ runningJobs: 5 }),
          makeSample({ runningJobs: 2 }),
        ]}
      />,
    );

    expect(screen.getByText("2 · peak 5")).toBeInTheDocument();
  });

  it("reports up/down state for availability series", () => {
    render(
      <TrendVisualization
        samples={[
          makeSample({ redisHealthy: true }),
          makeSample({ redisHealthy: false }),
        ]}
      />,
    );

    expect(screen.getAllByText("up")).toHaveLength(2);
    expect(screen.getByText("down")).toBeInTheDocument();
  });

  it("labels the sample window on the time axis", () => {
    render(
      <TrendVisualization
        samples={[makeSample(), makeSample(), makeSample()]}
      />,
    );

    expect(screen.getByText("now - 2 ticks")).toBeInTheDocument();
    expect(screen.getByText("now")).toBeInTheDocument();
  });
});
