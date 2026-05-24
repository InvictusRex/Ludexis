/**
 * Ludexis TypeScript Models
 * Core domain models for the archive platform
 * Always use ArchiveEntry terminology internally, not "Game"
 */

// ============================================================================
// Core Archive Entity
// ============================================================================

export type MetadataStatus = 'MATCHED' | 'PARTIAL' | 'UNMATCHED' | 'MANUAL'
export type EntryStatus = 'Not Started' | 'Playing' | 'Completed' | 'Dropped'
export type ArchiveType = 'ZIP' | 'RAR' | '7Z' | 'ISO' | 'FOLDER' | 'OTHER'
export type RelationshipType = 'FRANCHISE' | 'SEQUEL' | 'PREQUEL' | 'SPIN_OFF' | 'COLLECTION' | 'EPISODE' | 'REMASTER' | 'RELATED'
export type MetadataSource = 'IGDB' | 'STEAM' | 'GOG' | 'CUSTOM' | 'MANUAL'

export interface ArchiveEntry {
  id: string
  title: string
  description?: string

  // Archive Information
  filePath: string
  archiveType: ArchiveType
  storageDevice: string
  lastVerified: Date

  // Content Details
  engine?: string // e.g., "Unreal Engine 5", "Unity", "RenPy", "RPG Maker"
  version?: string
  releaseDate?: Date
  genres: string[]
  platforms: string[]

  // Metadata & Relationships
  developerId: string[]
  publisherId: string[]
  tagIds: string[]
  collectionIds: string[]

  // Entry Relationships (Franchises, sequels, etc.)
  parentSeriesId?: string
  relatedEntries: Array<{
    id: string
    relationshipType: RelationshipType
  }>

  // User Data
  personalRating?: number // 1-5 stars
  status: EntryStatus
  notes: string[]

  // Metadata Management
  metadataStatus: MetadataStatus
  metadataSource: MetadataSource
  metadataSourceId?: string
  lastMetadataRefresh?: Date

  // Artwork
  artwork: {
    coverArt?: string
    bannerArt?: string
    logoArt?: string
    screenshots: string[]
  }

  // System
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Developer - First-class browsing entity
// ============================================================================

export interface Developer {
  id: string
  name: string
  description?: string
  website?: string
  country?: string
  foundedDate?: Date
  artwork: {
    bannerArt?: string
    logoArt?: string
  }
  entryCount?: number // Computed
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Publisher - First-class browsing entity
// ============================================================================

export interface Publisher {
  id: string
  name: string
  description?: string
  website?: string
  country?: string
  foundedDate?: Date
  artwork: {
    bannerArt?: string
    logoArt?: string
  }
  entryCount?: number // Computed
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Tag - First-class metadata entity (not just strings)
// ============================================================================

export interface Tag {
  id: string
  name: string
  description?: string
  color?: string // Hex color for UI display
  artwork: {
    coverArt?: string
    bannerArt?: string
  }
  isFeatured: boolean
  entryCount?: number // Computed
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Franchise - Series/sequel grouping
// ============================================================================

export interface Franchise {
  id: string
  name: string
  description?: string
  artwork: {
    bannerArt?: string
  }
  entries: string[] // IDs of related ArchiveEntries in order
  chronologyInfo?: Array<{
    entryId: string
    season?: number
    episode?: number
    sequenceNumber?: number
  }>
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Collection - User-curated lists of entries
// ============================================================================

export interface Collection {
  id: string
  name: string
  description?: string
  entries: string[] // IDs of ArchiveEntries
  artwork: {
    coverArt?: string
    bannerArt?: string
  }
  customSort?: string
  visibility: 'public' | 'private' | 'admin_only'
  tags: string[]
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// User & Authentication
// ============================================================================

export type UserRole = 'ADMIN' | 'MODERATOR' | 'USER' | 'READ_ONLY'

export interface User {
  id: string
  email: string
  username: string
  role: UserRole
  avatar?: string
  preferences?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  userId: string
  token: string
  expiresAt: Date
}

// ============================================================================
// Admin & Jobs
// ============================================================================

export type JobType = 'FULL_SCAN' | 'INCREMENTAL_SCAN' | 'METADATA_REFRESH' | 'INTEGRITY_CHECK' | 'ARTWORK_REFRESH'
export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface LibraryJob {
  id: string
  type: JobType
  status: JobStatus
  progress: number // 0-100
  totalItems?: number
  processedItems?: number
  errorMessage?: string
  startedAt?: Date
  completedAt?: Date
  logs: string[]
  createdAt: Date
}

export interface MetadataReviewItem {
  id: string
  entryId: string
  reviewType: 'UNMATCHED' | 'MISSING_ARTWORK' | 'CONFLICTING_MATCH' | 'NEEDS_VERIFICATION'
  details?: Record<string, unknown>
  createdAt: Date
}

// ============================================================================
// Search & Filtering
// ============================================================================

export interface SearchFilters {
  query?: string
  genres?: string[]
  platforms?: string[]
  developerId?: string[]
  publisherId?: string[]
  tagIds?: string[]
  releaseYear?: { min?: number; max?: number }
  rating?: { min?: number; max?: number }
  engine?: string[]
  archiveType?: ArchiveType[]
  storageDevice?: string[]
  metadataStatus?: MetadataStatus[]
  status?: EntryStatus[]
  franchiseId?: string
  relationshipType?: RelationshipType[]
}

export interface SearchResults {
  entries: ArchiveEntry[]
  collections: Collection[]
  developers: Developer[]
  publishers: Publisher[]
  tags: Tag[]
  franchises: Franchise[]
  total: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
