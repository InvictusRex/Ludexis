'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Collection, ArchiveEntry, Tag, Developer, Franchise } from '@/lib/types'
import {
  collectionsApi,
  archiveApi,
  tagsApi,
  developersApi,
  franchisesApi,
} from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { CollectionCard } from '@/components/common/collection-card'
import { TagCard } from '@/components/common/tag-card'
import { DeveloperCard } from '@/components/common/developer-card'

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalCollections: 0,
    totalTags: 0,
    totalDevelopers: 0,
    metadataCoverage: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allCollections, allEntries, allTags, allDevelopers, allFranchises] =
          await Promise.all([
            collectionsApi.getAll(),
            archiveApi.getAll(),
            tagsApi.getAll(),
            developersApi.getAll(),
            franchisesApi.getAll(),
          ])

        // Filter for featured items
        const featuredCollections = allCollections.filter((c) => c.isFeatured).slice(0, 6)
        const featuredTags = allTags.filter((t) => t.isFeatured).slice(0, 8)

        setCollections(featuredCollections)
        setEntries(allEntries.slice(0, 8))
        setTags(featuredTags)
        setDevelopers(allDevelopers.slice(0, 6))
        setFranchises(allFranchises)

        // Calculate stats
        const matchedCount = allEntries.filter((e) => e.metadataStatus === 'MATCHED').length
        const coverage =
          allEntries.length > 0
            ? Math.round((matchedCount / allEntries.length) * 100)
            : 0

        setStats({
          totalEntries: allEntries.length,
          totalCollections: allCollections.length,
          totalTags: allTags.length,
          totalDevelopers: allDevelopers.length,
          metadataCoverage: coverage,
        })
      } catch (error) {
        console.error('Failed to load home data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-12">
        {/* Skeleton loading */}
        <div className="h-96 bg-card rounded-lg animate-pulse" />
        <div className="h-64 bg-card rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {/* Archive Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm mb-2">Total Archive Entries</p>
          <p className="text-3xl font-bold text-foreground">{stats.totalEntries}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm mb-2">Collections</p>
          <p className="text-3xl font-bold text-foreground">{stats.totalCollections}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm mb-2">Tags</p>
          <p className="text-3xl font-bold text-foreground">{stats.totalTags}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm mb-2">Developers</p>
          <p className="text-3xl font-bold text-foreground">{stats.totalDevelopers}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm mb-2">Metadata Coverage</p>
          <p className="text-3xl font-bold text-accent">{stats.metadataCoverage}%</p>
        </div>
      </div>

      {/* Featured Collections */}
      {collections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Collections</h2>
            <Link href="/collections" className="text-accent hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Tags */}
      {tags.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Featured Tags</h2>
            <Link href="/tags" className="text-accent hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tags.map((tag) => (
              <TagCard key={tag.id} tag={tag} />
            ))}
          </div>
        </section>
      )}

      {/* Developer Spotlight */}
      {developers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Developer Spotlight</h2>
            <Link href="/developers" className="text-accent hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {developers.slice(0, 3).map((developer) => (
              <DeveloperCard key={developer.id} developer={developer} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Entries */}
      {entries.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Archive Entries</h2>
            <Link href="/library" className="text-accent hover:underline">
              View Library →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
