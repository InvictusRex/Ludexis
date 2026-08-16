import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  SAVED_SEARCHES_KEY,
  SEARCH_STATE_KEY,
  deleteSavedSearch,
  loadSavedSearches,
  loadSearchState,
  saveSearch,
  saveSearchState,
} from "./saved-searches";
import type { SearchState } from "./saved-searches";

describe("saved-searches", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("saveSearch then loadSavedSearches round-trips the payload", () => {
    const payload = { query: "final fantasy", genre: "RPG" };

    const items = saveSearch("My Search", payload);

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("My Search");
    expect(items[0].payload).toEqual(payload);
    expect(typeof items[0].id).toBe("string");
    expect(typeof items[0].savedAt).toBe("string");

    const loaded = loadSavedSearches();
    expect(loaded).toEqual(items);
    expect(loaded[0].name).toBe("My Search");
    expect(loaded[0].payload).toEqual(payload);
  });

  it("deleteSavedSearch removes only the matching id", () => {
    saveSearch("First", { query: "a" });
    saveSearch("Second", { query: "b" });
    const items = saveSearch("Third", { query: "c" });
    const thirdId = items[2].id;

    const afterDelete = deleteSavedSearch(thirdId);

    expect(afterDelete).toHaveLength(2);
    expect(afterDelete.find((s) => s.id === thirdId)).toBeUndefined();

    const remaining = loadSavedSearches();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((s) => s.name)).toEqual(["First", "Second"]);
  });

  it("loadSavedSearches returns [] when getItem throws", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(loadSavedSearches()).toEqual([]);
  });

  it("loadSavedSearches returns [] when stored value is corrupt JSON", () => {
    window.localStorage.setItem(SAVED_SEARCHES_KEY, "{not valid json");

    expect(loadSavedSearches()).toEqual([]);
  });

  it("loadSavedSearches returns [] when stored value is not an array", () => {
    window.localStorage.setItem(
      SAVED_SEARCHES_KEY,
      JSON.stringify({ name: "oops" }),
    );

    expect(loadSavedSearches()).toEqual([]);
  });

  it("saveSearchState then loadSearchState round-trips every field", () => {
    const state: SearchState = {
      query: "zelda",
      genre: "RPG",
      tag: "retro",
      developer: "Nintendo",
      publisher: "Nintendo",
      franchise: "The Legend of Zelda",
      metadataStatus: "MATCHED",
      verificationStatus: "VERIFIED",
      storageDevice: "NAS-01",
    };

    saveSearchState(state);

    expect(loadSearchState()).toEqual(state);
  });

  it("loadSearchState returns null when nothing is stored", () => {
    expect(loadSearchState()).toBeNull();
  });

  it("loadSearchState returns null on corrupt JSON", () => {
    window.localStorage.setItem(SEARCH_STATE_KEY, "garbage{{{");

    expect(loadSearchState()).toBeNull();
  });

  it("loadSearchState fills missing fields with defaults", () => {
    window.localStorage.setItem(
      SEARCH_STATE_KEY,
      JSON.stringify({ query: "half-life", genre: "FPS" }),
    );

    expect(loadSearchState()).toEqual({
      query: "half-life",
      genre: "FPS",
      tag: "",
      developer: "",
      publisher: "",
      franchise: "",
      metadataStatus: "",
      verificationStatus: "",
      storageDevice: "",
    });
  });
});
