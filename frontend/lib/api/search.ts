import type { SearchResults } from "@/lib/types";
import { archiveApi } from "./archives";
import { collectionsApi } from "./collections";
import { developersApi } from "./developers";
import { publishersApi } from "./publishers";
import { tagsApi } from "./tags";
import { franchisesApi } from "./franchises";

export const searchApi = {
  async search(query: string, token?: string): Promise<SearchResults> {
    const q = query.trim().toLowerCase();

    const entries = await archiveApi.search(query, undefined, token);

    const [collections, developers, publishers, tags, franchises] =
      await Promise.all([
        collectionsApi.getAll(token),
        developersApi.getAll(token),
        publishersApi.getAll(token),
        tagsApi.getAll(token),
        franchisesApi.getAll(token),
      ]);

    const filterByName = (arr: any[]) =>
      arr.filter((a) => (a.name || "").toLowerCase().includes(q));

    const results: SearchResults = {
      total:
        entries.length +
        collections.length +
        developers.length +
        publishers.length +
        tags.length +
        franchises.length,
      entries,
      collections: filterByName(collections),
      developers: filterByName(developers),
      publishers: filterByName(publishers),
      tags: filterByName(tags),
      franchises: filterByName(franchises),
    };

    return results;
  },
};
