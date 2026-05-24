'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Developer } from '@/lib/types'
import { developersApi } from '@/lib/api'
import { DeveloperCard } from '@/components/common/developer-card'
import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [filteredDevelopers, setFilteredDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadDevelopers = async () => {
      try {
        const data = await developersApi.getAll()
        setDevelopers(data)
        setFilteredDevelopers(data)
      } catch (error) {
        console.error('Failed to load developers:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDevelopers()
  }, [])

  // Filter developers
  useEffect(() => {
    let result = [...developers]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.country?.toLowerCase().includes(q)
      )
    }

    // Sort by entry count descending
    result.sort((a, b) => (b.entryCount || 0) - (a.entryCount || 0))

    setFilteredDevelopers(result)
  }, [developers, searchQuery])

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Developers</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-64 bg-card rounded-lg animate-pulse border border-border"
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Developers</h1>
        <p className="text-muted-foreground">
          {filteredDevelopers.length} of {developers.length} developers
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Search Developers
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

      {/* Developers Grid */}
      {filteredDevelopers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map((developer) => (
            <Link key={developer.id} href={`/developers/${developer.id}`}>
              <DeveloperCard developer={developer} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No developers found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  )
}
