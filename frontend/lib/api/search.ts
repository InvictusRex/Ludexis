import type { SearchFilters, SearchResults } from "@/lib/types";
import { archiveApi } from "./archives";
import { collectionsApi } from "./collections";
import { developersApi } from "./developers";
import { publishersApi } from "./publishers";
import { tagsApi } from "./tags";
import { franchisesApi } from "./franchises";

export const searchApi = {
  async search(
    query: string,
    filters?: SearchFilters,
  ): Promise<SearchResults> {
    const q = query.trim();

    const [entries, collections, developers, publishers, tags, franchises] =
      await Promise.all([
        archiveApi.search(query, filters),
        collectionsApi.getAll(0, 100, q),
        developersApi.getAll(0, 100, q),
        publishersApi.getAll(0, 100, q),
        tagsApi.getAll(0, 100, q),
        franchisesApi.getAll(0, 100, q),
      ]);

    const results: SearchResults = {
      total:
        entries.length +
        collections.length +
        developers.items.length +
        publishers.items.length +
        tags.items.length +
        franchises.items.length,
      entries,
      collections,
      developers: developers.items,
      publishers: publishers.items,
      tags: tags.items,
      franchises: franchises.items,
    };

    return results;
  },
};
