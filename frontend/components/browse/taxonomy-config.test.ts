import { describe, expect, it, vi } from "vitest";
import { fetchAll, groupByLetter } from "./taxonomy-config";

vi.mock("@/lib/api", () => ({ developersApi: {}, publishersApi: {}, franchisesApi: {}, tagsApi: {} }));

const named = (...names: string[]) => names.map((name) => ({ name }));

describe("groupByLetter", () => {
  it("sorts case-insensitively and groups by first letter, folding accents", () => {
    const groups = groupByLetter(named("eXtasy", "Black Lime", "Émile", "achievements", "Ace"));

    expect(groups.map((group) => group.letter)).toEqual(["A", "B", "E"]);
    expect(groups[0].items.map((item) => item.name)).toEqual(["Ace", "achievements"]);
    expect(groups[2].items.map((item) => item.name)).toEqual(["Émile", "eXtasy"]);
  });

  it("files digits and symbols under # ahead of the letters", () => {
    const groups = groupByLetter(named("Zelda", "2K Games", "!Studio"));

    expect(groups.map((group) => group.letter)).toEqual(["#", "Z"]);
    expect(groups[0].items).toHaveLength(2);
  });

  it("returns nothing for an empty list", () => {
    expect(groupByLetter([])).toEqual([]);
  });
});

describe("fetchAll", () => {
  it("requests pages until a short page comes back", async () => {
    const rows = Array.from({ length: 5 }, (_, index) => index);
    const page = vi.fn(async (offset: number, limit: number) => rows.slice(offset, offset + limit));

    await expect(fetchAll(page, 2)).resolves.toEqual(rows);
    expect(page.mock.calls).toEqual([
      [0, 2],
      [2, 2],
      [4, 2],
    ]);
  });

  it("stops after an exactly full last page with one empty request", async () => {
    const page = vi.fn(async (offset: number) => (offset === 0 ? [1, 2] : []));

    await expect(fetchAll(page, 2)).resolves.toEqual([1, 2]);
    expect(page).toHaveBeenCalledTimes(2);
  });
});
