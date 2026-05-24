/**
 * Ludexis API Service Layer
 * Mock API layer structured for FastAPI backend migration
 * Uses consistent terminology: archiveApi (not gamesApi)
 */

import {
  ArchiveEntry,
  Developer,
  Publisher,
  Tag,
  Franchise,
  Collection,
  User,
  LibraryJob,
  SearchFilters,
  SearchResults,
  PaginatedResponse,
  ApiResponse,
} from './types'

import {
  mockArchiveEntries,
  mockDevelopers,
  mockPublishers,
  mockTags,
  mockFranchises,
  mockCollections,
  mockUsers,
  mockJobs,
  mockMetadataReviewQueue,
} from './mockData'

// ============================================================================
// Archive Service (primary entity)
// ============================================================================

export const archiveApi = {
  async getAll(): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockArchiveEntries), 300)
    })
  },

  async getById(id: string): Promise<ArchiveEntry | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entry = mockArchiveEntries.find((e) => e.id === id)
        resolve(entry || null)
      }, 200)
    })
  },

  async search(query: string, filters?: SearchFilters): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = mockArchiveEntries
        
        // Filter by query
        if (query) {
          const q = query.toLowerCase()
          results = results.filter((e) =>
            e.title.toLowerCase().includes(q) ||
            e.description?.toLowerCase().includes(q)
          )
        }
        
        // Apply other filters
        if (filters?.genres && filters.genres.length > 0) {
          results = results.filter((e) =>
            filters.genres!.some((g) => e.genres.includes(g))
          )
        }
        
        if (filters?.metadataStatus && filters.metadataStatus.length > 0) {
          results = results.filter((e) =>
            filters.metadataStatus!.includes(e.metadataStatus)
          )
        }
        
        resolve(results)
      }, 250)
    })
  },

  async getByDeveloper(developerId: string): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entries = mockArchiveEntries.filter((e) =>
          e.developerId.includes(developerId)
        )
        resolve(entries)
      }, 200)
    })
  },

  async getByPublisher(publisherId: string): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entries = mockArchiveEntries.filter((e) =>
          e.publisherId.includes(publisherId)
        )
        resolve(entries)
      }, 200)
    })
  },

  async getByTag(tagId: string): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entries = mockArchiveEntries.filter((e) =>
          e.tagIds.includes(tagId)
        )
        resolve(entries)
      }, 200)
    })
  },

  async getByFranchise(franchiseId: string): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entries = mockArchiveEntries.filter((e) =>
          e.parentSeriesId === franchiseId
        )
        resolve(entries)
      }, 200)
    })
  },

  async update(id: string, data: Partial<ArchiveEntry>): Promise<ArchiveEntry | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const entry = mockArchiveEntries.find((e) => e.id === id)
        if (entry) {
          Object.assign(entry, data, { updatedAt: new Date() })
          resolve(entry)
        } else {
          resolve(null)
        }
      }, 200)
    })
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockArchiveEntries.findIndex((e) => e.id === id)
        if (index > -1) {
          mockArchiveEntries.splice(index, 1)
          resolve(true)
        } else {
          resolve(false)
        }
      }, 200)
    })
  },
}

// ============================================================================
// Collections Service
// ============================================================================

export const collectionsApi = {
  async getAll(): Promise<Collection[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCollections), 300)
    })
  },

  async getById(id: string): Promise<Collection | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = mockCollections.find((c) => c.id === id)
        resolve(collection || null)
      }, 200)
    })
  },

  async create(collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Collection> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCollection: Collection = {
          ...collection,
          id: `col_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        mockCollections.push(newCollection)
        resolve(newCollection)
      }, 200)
    })
  },

  async update(id: string, data: Partial<Collection>): Promise<Collection | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = mockCollections.find((c) => c.id === id)
        if (collection) {
          Object.assign(collection, data, { updatedAt: new Date() })
          resolve(collection)
        } else {
          resolve(null)
        }
      }, 200)
    })
  },

  async delete(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockCollections.findIndex((c) => c.id === id)
        if (index > -1) {
          mockCollections.splice(index, 1)
          resolve(true)
        } else {
          resolve(false)
        }
      }, 200)
    })
  },

  async addEntries(collectionId: string, entryIds: string[]): Promise<Collection | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = mockCollections.find((c) => c.id === collectionId)
        if (collection) {
          collection.entries = [...new Set([...collection.entries, ...entryIds])]
          collection.updatedAt = new Date()
          resolve(collection)
        } else {
          resolve(null)
        }
      }, 200)
    })
  },

  async removeEntries(collectionId: string, entryIds: string[]): Promise<Collection | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const collection = mockCollections.find((c) => c.id === collectionId)
        if (collection) {
          collection.entries = collection.entries.filter((id) => !entryIds.includes(id))
          collection.updatedAt = new Date()
          resolve(collection)
        } else {
          resolve(null)
        }
      }, 200)
    })
  },
}

// ============================================================================
// Developers Service
// ============================================================================

export const developersApi = {
  async getAll(): Promise<Developer[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const enriched = mockDevelopers.map((dev) => ({
          ...dev,
          entryCount: mockArchiveEntries.filter((e) =>
            e.developerId.includes(dev.id)
          ).length,
        }))
        resolve(enriched)
      }, 300)
    })
  },

  async getById(id: string): Promise<Developer | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dev = mockDevelopers.find((d) => d.id === id)
        if (!dev) {
          resolve(null)
          return
        }
        const entryCount = mockArchiveEntries.filter((e) =>
          e.developerId.includes(id)
        ).length
        resolve({ ...dev, entryCount })
      }, 200)
    })
  },

  async getEntries(developerId: string): Promise<ArchiveEntry[]> {
    return archiveApi.getByDeveloper(developerId)
  },
}

// ============================================================================
// Publishers Service
// ============================================================================

export const publishersApi = {
  async getAll(): Promise<Publisher[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const enriched = mockPublishers.map((pub) => ({
          ...pub,
          entryCount: mockArchiveEntries.filter((e) =>
            e.publisherId.includes(pub.id)
          ).length,
        }))
        resolve(enriched)
      }, 300)
    })
  },

  async getById(id: string): Promise<Publisher | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pub = mockPublishers.find((p) => p.id === id)
        if (!pub) {
          resolve(null)
          return
        }
        const entryCount = mockArchiveEntries.filter((e) =>
          e.publisherId.includes(id)
        ).length
        resolve({ ...pub, entryCount })
      }, 200)
    })
  },

  async getEntries(publisherId: string): Promise<ArchiveEntry[]> {
    return archiveApi.getByPublisher(publisherId)
  },
}

// ============================================================================
// Tags Service
// ============================================================================

export const tagsApi = {
  async getAll(): Promise<Tag[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const enriched = mockTags.map((tag) => ({
          ...tag,
          entryCount: mockArchiveEntries.filter((e) =>
            e.tagIds.includes(tag.id)
          ).length,
        }))
        resolve(enriched)
      }, 300)
    })
  },

  async getById(id: string): Promise<Tag | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tag = mockTags.find((t) => t.id === id)
        if (!tag) {
          resolve(null)
          return
        }
        const entryCount = mockArchiveEntries.filter((e) =>
          e.tagIds.includes(id)
        ).length
        resolve({ ...tag, entryCount })
      }, 200)
    })
  },

  async getEntries(tagId: string): Promise<ArchiveEntry[]> {
    return archiveApi.getByTag(tagId)
  },

  async getRelatedTags(tagId: string): Promise<Tag[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tag = mockTags.find((t) => t.id === tagId)
        if (!tag) {
          resolve([])
          return
        }
        // Simple relation: return other tags that appear in same entries
        const relatedTagIds = new Set<string>()
        mockArchiveEntries
          .filter((e) => e.tagIds.includes(tagId))
          .forEach((e) => {
            e.tagIds.forEach((id) => {
              if (id !== tagId) relatedTagIds.add(id)
            })
          })
        const related = mockTags.filter((t) => relatedTagIds.has(t.id))
        resolve(related)
      }, 250)
    })
  },
}

// ============================================================================
// Franchises Service
// ============================================================================

export const franchisesApi = {
  async getAll(): Promise<Franchise[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockFranchises), 300)
    })
  },

  async getById(id: string): Promise<Franchise | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const franchise = mockFranchises.find((f) => f.id === id)
        resolve(franchise || null)
      }, 200)
    })
  },

  async getEntries(franchiseId: string): Promise<ArchiveEntry[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const franchise = mockFranchises.find((f) => f.id === franchiseId)
        if (!franchise) {
          resolve([])
          return
        }
        const entries = mockArchiveEntries.filter((e) =>
          franchise.entries.includes(e.id)
        )
        resolve(entries)
      }, 200)
    })
  },
}

// ============================================================================
// Search Service (unified search)
// ============================================================================

export const searchApi = {
  async search(query: string, filters?: SearchFilters): Promise<SearchResults> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const q = query.toLowerCase()

        // Search entries
        const entries = mockArchiveEntries.filter((e) =>
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
        )

        // Search collections
        const collections = mockCollections.filter((c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
        )

        // Search developers
        const developers = mockDevelopers.filter((d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
        )

        // Search publishers
        const publishers = mockPublishers.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        )

        // Search tags
        const tags = mockTags.filter((t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        )

        // Search franchises
        const franchises = mockFranchises.filter((f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
        )

        const total =
          entries.length +
          collections.length +
          developers.length +
          publishers.length +
          tags.length +
          franchises.length

        resolve({
          entries,
          collections,
          developers,
          publishers,
          tags,
          franchises,
          total,
        })
      }, 400)
    })
  },
}

// ============================================================================
// Auth Service
// ============================================================================

export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string } | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find((u) => u.email === email)
        if (user) {
          resolve({
            user,
            token: `mock_token_${user.id}_${Date.now()}`,
          })
        } else {
          resolve(null)
        }
      }, 300)
    })
  },

  async getCurrentUser(token: string): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock: extract user ID from token (in real implementation, validate JWT)
        const userId = token.split('_')[2]
        const user = mockUsers.find((u) => u.id === userId)
        resolve(user || null)
      }, 200)
    })
  },

  async logout(): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 100)
    })
  },
}

// ============================================================================
// Admin Service
// ============================================================================

export const adminApi = {
  jobs: {
    async getQueue(): Promise<LibraryJob[]> {
      return new Promise((resolve) => {
        setTimeout(() => {
          const queued = mockJobs.filter((j) => j.status === 'QUEUED')
          resolve(queued)
        }, 200)
      })
    },

    async getRunning(): Promise<LibraryJob[]> {
      return new Promise((resolve) => {
        setTimeout(() => {
          const running = mockJobs.filter((j) => j.status === 'RUNNING')
          resolve(running)
        }, 200)
      })
    },

    async getCompleted(): Promise<LibraryJob[]> {
      return new Promise((resolve) => {
        setTimeout(() => {
          const completed = mockJobs.filter((j) => j.status === 'COMPLETED')
          resolve(completed)
        }, 200)
      })
    },

    async getAllJobs(): Promise<LibraryJob[]> {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockJobs), 200)
      })
    },
  },

  metadata: {
    async getReviewQueue() {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockMetadataReviewQueue), 200)
      })
    },

    async getUnmatchedEntries(): Promise<ArchiveEntry[]> {
      return new Promise((resolve) => {
        setTimeout(() => {
          const unmatched = mockArchiveEntries.filter(
            (e) => e.metadataStatus === 'UNMATCHED'
          )
          resolve(unmatched)
        }, 200)
      })
    },
  },
}
