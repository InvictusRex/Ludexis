export const DEFAULT_PAGE_SIZE = 25;

export const PAGE_SIZES = [10, 25, 50, 100];

export interface PageQuery {
  offset: number;
  limit: number;
}

export function pageToOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function buildPageQuery(page: number, limit: number): PageQuery {
  return {
    offset: pageToOffset(page, limit),
    limit,
  };
}

export function hasMore(count: number, limit: number): boolean {
  return count === limit;
}
