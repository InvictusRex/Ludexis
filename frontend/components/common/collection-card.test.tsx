import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CollectionCard } from "./collection-card";
import type { Collection } from "@/lib/types";

const collection = (autoKey: string | null) =>
  ({
    id: "c1",
    name: "Meadow Tales",
    description: null,
    visibility: "public",
    entry_ids: ["a", "b"],
    auto_key: autoKey,
  }) as unknown as Collection;

describe("CollectionCard", () => {
  afterEach(cleanup);

  it("marks a collection gathered from episodes as Auto", () => {
    render(<CollectionCard collection={collection("meadowtales")} />);
    expect(screen.getByText("Auto")).toBeInTheDocument();
    expect(screen.getByText("2 entries")).toBeInTheDocument();
  });

  it("shows no Auto badge on a collection made by hand", () => {
    render(<CollectionCard collection={collection(null)} />);
    expect(screen.queryByText("Auto")).not.toBeInTheDocument();
  });
});
