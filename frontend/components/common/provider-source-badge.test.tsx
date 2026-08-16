import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ProviderSourceBadge } from "./provider-source-badge";

describe("ProviderSourceBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the provider name from metadata_source", () => {
    render(<ProviderSourceBadge source="IGDB" sourceCode="igdb-123" />);

    expect(screen.getByText("IGDB")).toBeInTheDocument();
  });

  it("sets the source code as the title tooltip attribute when present", () => {
    render(<ProviderSourceBadge source="IGDB" sourceCode="igdb-123" />);

    expect(screen.getByText("IGDB")).toHaveAttribute("title", "igdb-123");
  });

  it("renders nothing when source is absent", () => {
    const { container } = render(<ProviderSourceBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  it("omits the title attribute when no source code is present", () => {
    render(<ProviderSourceBadge source="IGDB" />);

    expect(screen.getByText("IGDB")).not.toHaveAttribute("title");
  });
});
