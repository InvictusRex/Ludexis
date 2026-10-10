export interface MetadataSearchResult {
  provider: string;
  provider_id: string;
  title: string;
  summary?: string | null;
  release_date?: string | null;
  score?: number | null;
  cover_url?: string | null;
  developers?: string[];
}

export interface MetadataDetails {
  provider: string;
  provider_id: string;
  title: string;
  description?: string | null;
  release_date?: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  tags: string[];
  cover_urls: string[];
  banner_urls: string[];
  logo_urls: string[];
  artwork_urls: string[];
}
