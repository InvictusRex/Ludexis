'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SearchResults } from '@/lib/types'
import { searchApi } from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { CollectionCard } from '@/components/common/collection-card'
import { TagCard } from '@/components/common/tag-card'
import { DeveloperCard } from '@/components/common/developer-card'
import { Input } from '@/components/ui/input'
import { Search, FileText } from 'lucide-react'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(!!initialQuery)

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults(null)
        return
      }

      setLoading(true)
      try {
        const data = await searchApi.search(query)
        setResults(data)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(performSearch, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already triggered by useEffect
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="search"
            placeholder="Search archive entries, collections, developers, publishers, tags, and franchises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="pl-10 bg-card border-border text-lg py-6"
          />
          <Search
            size={24}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
          <p className="mt-4 text-muted-foreground">Searching...</p>
        </div>
      ) : results && results.total > 0 ? (
        <div className="space-y-12">
          {/* Archive Entries */}
          {results.entries.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Archive Entries ({results.entries.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.entries.map((entry) => (
                  <ArchiveEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* Collections */}
          {results.collections.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Collections ({results.collections.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.collections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            </section>
          )}

          {/* Developers */}
          {results.developers.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Developers ({results.developers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.developers.map((developer) => (
                  <Link key={developer.id} href={`/developers/${developer.id}`}>
                    <DeveloperCard developer={developer} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Publishers */}
          {results.publishers.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Publishers ({results.publishers.length})
              </h2>
              <div className="space-y-2">
                {results.publishers.map((publisher) => (
                  <Link
                    key={publisher.id}
                    href={`/publishers/${publisher.id}`}
                    className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <p className="font-semibold text-foreground">
                      {publisher.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {results.tags.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Tags ({results.tags.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.tags.map((tag) => (
                  <Link key={tag.id} href={`/tags/${tag.id}`}>
                    <TagCard tag={tag} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Franchises */}
          {results.franchises.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Franchises ({results.franchises.length})
              </h2>
              <div className="space-y-2">
                {results.franchises.map((franchise) => (
                  <Link
                    key={franchise.id}
                    href={`/franchises`}
                    className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                  >
                    <p className="font-semibold text-foreground">
                      {franchise.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {franchise.entries.length} entries
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : query.trim() ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No results found
          </h3>
          <p className="text-muted-foreground">
            Try searching with different keywords
          </p>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Start typing to search the archive</p>
        </div>
      )}
    </div>
  )
}
