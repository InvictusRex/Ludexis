// Central API re-exports — forwards to real implementations in lib/api/*
export { authApi } from "./api/auth";
export { apiClient } from "./api/client";
export { archiveApi } from "./api/archives";
export { jobsApi } from "./api/jobs";
export { collectionsApi } from "./api/collections";
export { tagsApi } from "./api/tags";
export { developersApi } from "./api/developers";
export { publishersApi } from "./api/publishers";
export { franchisesApi } from "./api/franchises";
export { searchApi } from "./api/search";
export { adminApi } from "./api/admin";

// Note: other APIs (collections, developers, publishers, tags, franchises,
// search, admin) should be added to `lib/api/` as concrete modules and
// re-exported here. This file keeps the same import surface as the previous
// `lib/api.ts` aggregator so pages importing from `@/lib/api` continue to work.
