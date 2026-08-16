import type { ArchiveEntry } from "./archive";
import type { Collection } from "./collection";
import type { Developer } from "./developer";
import type { Publisher } from "./publisher";
import type { Tag } from "./tag";
import type { Franchise } from "./franchise";

export interface SearchResults {
  total: number;
  entries: ArchiveEntry[];
  collections: Collection[];
  developers: Developer[];
  publishers: Publisher[];
  tags: Tag[];
  franchises: Franchise[];
}

export interface SearchFilters {
  genres?: string[];
  tags?: string[];
  developers?: string[];
  publishers?: string[];
  franchises?: string[];
  metadataStatus?: string[];
  verificationStatus?: string[];
  storageDevices?: string[];
}
