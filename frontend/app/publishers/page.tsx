'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Publisher } from '@/lib/types'
import { publishersApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Search, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadPublishers = async () => {
      try {
        const data = await publishersApi.getAll()
        setPublishers(data)
        setFilteredPublishers(data)
      } catch (error) {
        console.error('Failed to load publishers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPublishers()
  }, [])

  // Filter publishers
  useEffect(() => {
    let result = [...publishers]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q)
      )
    }

    // Sort by entry count descending
    result.sort((a, b) => (b.entryCount || 0) - (a.entryCount || 0))

    setFilteredPublishers(result)
  }, [publishers, searchQuery])

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Publishers</h1>
        <div className="space-y-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-20 bg-card rounded-lg animate-pulse border border-border"
              />
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Publishers</h1>
        <p className="text-muted-foreground">
          {filteredPublishers.length} of {publishers.length} publishers
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Search Publishers
        </label>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search by name, description, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>

      {/* Publishers List */}
      {filteredPublishers.length > 0 ? (
        <div className="space-y-3">
          {filteredPublishers.map((publisher) => (
            <Link key={publisher.id} href={`/publishers/${publisher.id}`}>
              <div className="bg-card rounded-lg border border-border p-4 hover:border-accent transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {publisher.name}
                    </h3>
                    {publisher.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {publisher.description}
                      </p>
                    )}
                    {publisher.country && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {publisher.country}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="ml-2">
                      {publisher.entryCount || 0}
                    </Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Building2 className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No publishers found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  )
}
