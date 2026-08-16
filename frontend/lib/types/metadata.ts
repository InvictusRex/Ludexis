export interface MetadataReviewItem {
  id: string;
  entry_id: string;
  notes?: string;
  suggested_title?: string;
  created_at?: string;
}

export interface MetadataSearchResult {
  provider: string;
  provider_id: string;
  title: string;
  summary?: string | null;
  release_date?: string | null;
  score?: number | null;
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
