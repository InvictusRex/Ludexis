'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tag, ArchiveEntry } from '@/lib/types'
import { tagsApi, archiveApi } from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TagDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tag, setTag] = useState<Tag | null>(null)
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [relatedTags, setRelatedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const tagData = await tagsApi.getById(id)
        setTag(tagData)

        const tagEntries = await tagsApi.getEntries(id)
        setEntries(tagEntries)

        const relatedTagsData = await tagsApi.getRelatedTags(id)
        setRelatedTags(relatedTagsData)
      } catch (error) {
        console.error('Failed to load tag:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-64 bg-card rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Tag not found</p>
        <Link href="/tags">
          <Button variant="outline">Back to Tags</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Link href="/tags" className="inline-flex items-center gap-2 text-accent hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Tags
      </Link>

      {/* Tag Header */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start gap-6">
          {tag.artwork?.coverArt && (
            <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={tag.artwork.coverArt}
                alt={tag.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{tag.name}</h1>
              {tag.color && (
                <div
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: tag.color }}
                  title={tag.color}
                />
              )}
            </div>
            {tag.description && (
              <p className="text-muted-foreground mb-4">{tag.description}</p>
            )}
            <div className="flex items-center gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Total Entries</p>
                <p className="text-lg font-semibold text-accent">{entries.length}</p>
              </div>
              {tag.isFeatured && (
                <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                  Featured Tag
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Related Tags</h2>
          <div className="flex flex-wrap gap-3">
            {relatedTags.map((relatedTag) => (
              <Link
                key={relatedTag.id}
                href={`/tags/${relatedTag.id}`}
                className="px-4 py-2 rounded-lg bg-card border border-border text-foreground hover:border-accent transition-colors"
              >
                {relatedTag.name}
                {relatedTag.entryCount && (
                  <span className="text-muted-foreground ml-2">({relatedTag.entryCount})</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Archive Entries</h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No entries with this tag</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {entries.map((entry) => (
              <ArchiveEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
