'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Franchise, ArchiveEntry } from '@/lib/types'
import { franchisesApi, archiveApi } from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { Input } from '@/components/ui/input'
import { Search, Film } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [filteredFranchises, setFilteredFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFranchise, setSelectedFranchise] = useState<Franchise | null>(
    null
  )
  const [franchiseEntries, setFranchiseEntries] = useState<ArchiveEntry[]>([])

  useEffect(() => {
    const loadFranchises = async () => {
      try {
        const data = await franchisesApi.getAll()
        setFranchises(data)
        setFilteredFranchises(data)
        if (data.length > 0) {
          setSelectedFranchise(data[0])
        }
      } catch (error) {
        console.error('Failed to load franchises:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFranchises()
  }, [])

  // Filter franchises
  useEffect(() => {
    let result = [...franchises]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.description?.toLowerCase().includes(q)
      )
    }

    setFilteredFranchises(result)
  }, [franchises, searchQuery])

  // Load entries for selected franchise
  useEffect(() => {
    const loadEntries = async () => {
      if (!selectedFranchise) return
      try {
        const entries = await franchisesApi.getEntries(selectedFranchise.id)
        setFranchiseEntries(entries)
      } catch (error) {
        console.error('Failed to load franchise entries:', error)
      }
    }

    loadEntries()
  }, [selectedFranchise])

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Franchises</h1>
        <div className="h-64 bg-card rounded-lg animate-pulse border border-border" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Franchises</h1>
        <p className="text-muted-foreground">
          {filteredFranchises.length} of {franchises.length} franchises
        </p>
      </div>

      {/* Search */}
      <div className="bg-card rounded-lg border border-border p-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Search Franchises
        </label>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search by name or description..."
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

      {filteredFranchises.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Franchises List */}
          <div className="lg:col-span-1 space-y-2 max-h-96 overflow-y-auto">
            {filteredFranchises.map((franchise) => (
              <button
                key={franchise.id}
                onClick={() => setSelectedFranchise(franchise)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedFranchise?.id === franchise.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-accent'
                }`}
              >
                <h3 className="font-semibold line-clamp-2">{franchise.name}</h3>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {franchise.entries.length} entries
                </Badge>
              </button>
            ))}
          </div>

          {/* Franchise Details */}
          <div className="lg:col-span-3 space-y-6">
            {selectedFranchise && (
              <>
                {/* Banner */}
                {selectedFranchise.artwork?.bannerArt && (
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
                    <img
                      src={selectedFranchise.artwork.bannerArt}
                      alt={selectedFranchise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Title & Description */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedFranchise.name}
                  </h2>
                  {selectedFranchise.description && (
                    <p className="text-muted-foreground">
                      {selectedFranchise.description}
                    </p>
                  )}
                </div>

                {/* Entries */}
                {franchiseEntries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Games in this franchise ({franchiseEntries.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {franchiseEntries.map((entry) => (
                        <ArchiveEntryCard key={entry.id} entry={entry} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Film className="mx-auto mb-4 text-muted-foreground" size={48} />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No franchises found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  )
}
