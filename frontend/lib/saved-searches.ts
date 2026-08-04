export interface SavedSearch {
  id: string;
  name: string;
  payload: object;
  savedAt: string;
}

export interface SearchState {
  query: string;
  genre: string;
  tag: string;
  developer: string;
  publisher: string;
  franchise: string;
  metadataStatus: string;
  verificationStatus: string;
  storageDevice: string;
}

export const SAVED_SEARCHES_KEY = "ludexis.savedSearches";
export const SEARCH_STATE_KEY = "ludexis.searchState";

export const EMPTY_SEARCH_STATE: SearchState = {
  query: "",
  genre: "",
  tag: "",
  developer: "",
  publisher: "",
  franchise: "",
  metadataStatus: "",
  verificationStatus: "",
  storageDevice: "",
};

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(SAVED_SEARCHES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is SavedSearch =>
        !!item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.payload === "object",
    );
  } catch {
    return [];
  }
}

function writeSavedSearches(items: SavedSearch[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

export function saveSearch(name: string, payload: object): SavedSearch[] {
  const items = loadSavedSearches();
  const updated = [
    ...items,
    {
      id: createId(),
      name,
      payload,
      savedAt: new Date().toISOString(),
    },
  ];
  writeSavedSearches(updated);
  return updated;
}

export function deleteSavedSearch(id: string): SavedSearch[] {
  const updated = loadSavedSearches().filter((item) => item.id !== id);
  writeSavedSearches(updated);
  return updated;
}

export function loadSearchState(): SearchState | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SEARCH_STATE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SearchState>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return { ...EMPTY_SEARCH_STATE, ...parsed };
  } catch {
    return null;
  }
}

export function saveSearchState(state: SearchState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
