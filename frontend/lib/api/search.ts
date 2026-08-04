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
    const q = query.trim().toLowerCase();

    const entries = await archiveApi.search(query, filters);

    const [collections, developers, publishers, tags, franchises] =
      await Promise.all([
        collectionsApi.getAll(),
        developersApi.getAll(),
        publishersApi.getAll(),
        tagsApi.getAll(),
        franchisesApi.getAll(),
      ]);

    const filterByName = (arr: any[]) =>
      arr.filter((a) => (a.name || "").toLowerCase().includes(q));

    const filteredCollections = filterByName(collections);
    const filteredDevelopers = filterByName(developers);
    const filteredPublishers = filterByName(publishers);
    const filteredTags = filterByName(tags);
    const filteredFranchises = filterByName(franchises);

    const results: SearchResults = {
      total:
        entries.length +
        filteredCollections.length +
        filteredDevelopers.length +
        filteredPublishers.length +
        filteredTags.length +
        filteredFranchises.length,
      entries,
      collections: filteredCollections,
      developers: filteredDevelopers,
      publishers: filteredPublishers,
      tags: filteredTags,
      franchises: filteredFranchises,
    };

    return results;
  },
};
