'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Developer, ArchiveEntry } from '@/lib/types'
import { developersApi, archiveApi } from '@/lib/api'
import { ArchiveEntryCard } from '@/components/common/archive-entry-card'
import { ArrowLeft, Globe, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DeveloperDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [developer, setDeveloper] = useState<Developer | null>(null)
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const developerData = await developersApi.getById(id)
        setDeveloper(developerData)

        const developerEntries = await developersApi.getEntries(id)
        setEntries(developerEntries)
      } catch (error) {
        console.error('Failed to load developer:', error)
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

  if (!developer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Developer not found</p>
        <Link href="/developers">
          <Button variant="outline">Back to Developers</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Link href="/developers" className="inline-flex items-center gap-2 text-accent hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to Developers
      </Link>

      {/* Developer Banner */}
      <div className="relative h-80 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
        {developer.artwork?.bannerArt ? (
          <img
            src={developer.artwork.bannerArt}
            alt={developer.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-lg">No Banner Art</span>
          </div>
        )}

        {/* Developer Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent flex items-end">
          <div className="p-8 w-full">
            <h1 className="text-4xl font-bold text-foreground mb-2">{developer.name}</h1>
            {developer.description && (
              <p className="text-muted-foreground max-w-2xl mb-4">{developer.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Developer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground mb-2">Archive Entries</p>
          <p className="text-2xl font-bold text-accent">{entries.length}</p>
        </div>
        {developer.country && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              Country
            </p>
            <p className="text-lg font-medium text-foreground">{developer.country}</p>
          </div>
        )}
        {developer.foundedDate && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Founded
            </p>
            <p className="text-lg font-medium text-foreground">
              {new Date(developer.foundedDate).getFullYear()}
            </p>
          </div>
        )}
        {developer.website && (
          <div className="bg-card p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4" />
              Website
            </p>
            <a
              href={developer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline truncate"
            >
              Visit Site
            </a>
          </div>
        )}
      </div>

      {/* Archive Entries */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Games by {developer.name}</h2>
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">No entries from this developer</p>
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
