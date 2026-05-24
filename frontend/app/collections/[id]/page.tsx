'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Collection, ArchiveEntry } from '@/lib/types'
import { collectionsApi, archiveApi } from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { ArrowLeft, Edit2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CollectionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [collection, setCollection] = useState<Collection | null>(null)
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const collectionData = await collectionsApi.getById(id)
        setCollection(collectionData)

        const allEntries = await archiveApi.getAll()
        const collectionEntries = allEntries.filter((e) =>
          collectionData.entries?.includes(e.id)
        )
        setEntries(collectionEntries)
      } catch (error) {
        console.error('Failed to load collection:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-96 bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Collection not found</p>
        <Link href="/collections">
          <Button variant="outline">Back to Collections</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Link href="/collections" className="inline-flex items-center gap-2 text-accent hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Collection Banner */}
      <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {collection.artwork?.bannerArt ? (
          <img
            src={collection.artwork.bannerArt}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-lg">No Banner Art</span>
          </div>
        )}

        {/* Collection Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end">
          <div className="p-8 w-full">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    {collection.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{entries.length} entries</span>
                  {collection.visibility && (
                    <span className="flex items-center gap-1">
                      {collection.visibility === 'private' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Private
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Public
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Entries Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Entries in Collection</h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No entries in this collection yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      {collection.tags && collection.tags.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Collection Tags</h3>
          <div className="flex flex-wrap gap-2">
            {collection.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
