import type { LibraryQuery, LibrarySort } from "@/lib/types";
import type { Density } from "@/components/media/poster-grid";

// Exact-name filters, passed straight through to /search.
export const FILTER_KEYS = [
  "genre",
  "tag",
  "developer",
  "publisher",
  "franchise",
  "collection",
  "metadata_status",
  "verification_status",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];
export type SortField = "title" | "created_at" | "release_date" | "file_size";

export interface LibraryState extends Partial<Record<FilterKey, string>> {
  q: string;
  sort: LibrarySort;
  /** One card per game (versions grouped); off shows every file. */
  group: boolean;
  density: Density;
}

export const DEFAULT_SORT: LibrarySort = "title";
const SORT_FIELDS: SortField[] = ["title", "created_at", "release_date", "file_size"];

function isSort(value: string | null): value is LibrarySort {
  return !!value && SORT_FIELDS.includes(value.replace(/^-/, "") as SortField);
}

export const sortField = (sort: LibrarySort) => sort.replace(/^-/, "") as SortField;
export const sortDescending = (sort: LibrarySort) => sort.startsWith("-");

export function parseLibraryParams(params: URLSearchParams): LibraryState {
  const sort = params.get("sort");
  const state: LibraryState = {
    q: params.get("q")?.trim() ?? "",
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    group: params.get("group") !== "0",
    density: params.get("density") === "compact" ? "compact" : "comfortable",
  };
  for (const key of FILTER_KEYS) {
    const value = params.get(key)?.trim();
    if (value) {
      state[key] = value;
    }
  }
  return state;
}

/** Query string for a library view; defaults are left out so links stay short. */
export function serializeLibraryState(state: Partial<LibraryState>): string {
  const params = new URLSearchParams();
  if (state.q?.trim()) {
    params.set("q", state.q.trim());
  }
  if (state.sort && state.sort !== DEFAULT_SORT) {
    params.set("sort", state.sort);
  }
  for (const key of FILTER_KEYS) {
    const value = state[key]?.trim();
    if (value) {
      params.set(key, value);
    }
  }
  if (state.group === false) {
    params.set("group", "0");
  }
  if (state.density === "compact") {
    params.set("density", "compact");
  }
  return params.toString();
}

/** A link into the library, e.g. `libraryHref({ genre: "RPG" })`. */
export function libraryHref(state: Partial<LibraryState> = {}): string {
  const query = serializeLibraryState(state);
  return query ? `/library?${query}` : "/library";
}

export function activeFilters(state: LibraryState): [FilterKey, string][] {
  return FILTER_KEYS.flatMap((key) => (state[key] ? [[key, state[key]] as [FilterKey, string]] : []));
}

export function toLibraryQuery(state: LibraryState): LibraryQuery {
  const query: LibraryQuery = { sort: state.sort, group_versions: state.group };
  if (state.q) {
    query.q = state.q;
  }
  for (const [key, value] of activeFilters(state)) {
    query[key] = value;
  }
  return query;
}
