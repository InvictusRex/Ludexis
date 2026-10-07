import { describe, expect, it } from "vitest";
import {
  activeFilters,
  libraryHref,
  parseLibraryParams,
  serializeLibraryState,
  toLibraryQuery,
} from "./library-params";

const parse = (query: string) => parseLibraryParams(new URLSearchParams(query));

describe("library params", () => {
  it("falls back to the defaults for an empty or invalid query", () => {
    expect(parse("")).toEqual({ q: "", sort: "title", group: true, density: "comfortable" });
    expect(parse("sort=rating&density=huge&group=maybe").sort).toBe("title");
    expect(parse("sort=rating&density=huge").density).toBe("comfortable");
    expect(parse("group=maybe").group).toBe(true);
  });

  it("reads every supported parameter", () => {
    const state = parse(
      "q=+meadow+&sort=-release_date&genre=RPG&tag=retro&developer=Polaris&publisher=Orbit" +
        "&franchise=Skybound&collection=Classics&metadata_status=UNMATCHED&verification_status=MISSING" +
        "&group=0&density=compact&genre_extra=x",
    );
    expect(state).toEqual({
      q: "meadow",
      sort: "-release_date",
      genre: "RPG",
      tag: "retro",
      developer: "Polaris",
      publisher: "Orbit",
      franchise: "Skybound",
      collection: "Classics",
      metadata_status: "UNMATCHED",
      verification_status: "MISSING",
      group: false,
      density: "compact",
    });
  });

  it("round-trips through the URL and leaves defaults out", () => {
    const query = "q=star&sort=-created_at&genre=Visual+Novel&group=0&density=compact";
    expect(serializeLibraryState(parse(query))).toBe(query);
    expect(serializeLibraryState(parse("sort=title&group=1&density=comfortable"))).toBe("");
  });

  it("builds library links", () => {
    expect(libraryHref()).toBe("/library");
    expect(libraryHref({ genre: "Role & Play" })).toBe("/library?genre=Role+%26+Play");
    expect(libraryHref({ sort: "-created_at" })).toBe("/library?sort=-created_at");
  });

  it("maps state to the /search query", () => {
    const state = parse("q=star&tag=retro&group=0&density=compact");
    expect(activeFilters(state)).toEqual([["tag", "retro"]]);
    expect(toLibraryQuery(state)).toEqual({ q: "star", tag: "retro", sort: "title", group_versions: false });
    expect(toLibraryQuery(parse(""))).toEqual({ sort: "title", group_versions: true });
  });
});
