'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArchiveEntry, Developer, Publisher } from '@/lib/types'
import { archiveApi, developersApi, publishersApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Edit,
  Share2,
  Heart,
  Download,
  FolderOpen,
  Calendar,
  Zap,
} from 'lucide-react'

export default function ArchiveDetailsPage() {
  const params = useParams()
  const entryId = params.id as string

  const [entry, setEntry] = useState<ArchiveEntry | null>(null)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await archiveApi.getById(entryId)
        if (!data) {
          setEntry(null)
          return
        }

        setEntry(data)

        // Load related developers and publishers
        const devs = await Promise.all(
          data.developerId.map((id) => developersApi.getById(id))
        )
        const pubs = await Promise.all(
          data.publisherId.map((id) => publishersApi.getById(id))
        )

        setDevelopers(devs.filter(Boolean) as Developer[])
        setPublishers(pubs.filter(Boolean) as Publisher[])
      } catch (error) {
        console.error('Failed to load archive details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [entryId])

  if (loading) {
    return <div className="h-96 bg-card rounded-lg animate-pulse" />
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Entry not found
        </h1>
        <Link href="/library">
          <Button>Back to Library</Button>
        </Link>
      </div>
    )
  }

  const getMetadataStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return 'bg-green-900 text-green-200 border-green-700'
      case 'PARTIAL':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700'
      case 'UNMATCHED':
        return 'bg-red-900 text-red-200 border-red-700'
      case 'MANUAL':
        return 'bg-blue-900 text-blue-200 border-blue-700'
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/library" className="hover:text-accent">
          Library
        </Link>
        <span>/</span>
        <span>{entry.title}</span>
      </div>

      {/* Header with Banner */}
      {entry.artwork?.bannerArt && (
        <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
          <img
            src={entry.artwork.bannerArt}
            alt={entry.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Cover & Info */}
        <div className="space-y-6">
          {/* Cover Art */}
          {entry.artwork?.coverArt && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={entry.artwork.coverArt}
                alt={entry.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="default"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart
                size={18}
                className={isFavorited ? 'fill-current' : ''}
              />
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </Button>
            <Button className="w-full" variant="outline">
              <Edit size={18} />
              Edit Entry
            </Button>
            <Button className="w-full" variant="outline">
              <Share2 size={18} />
              Share
            </Button>
          </div>

          {/* Metadata Status */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3">
              Metadata Status
            </h3>
            <div className="space-y-2">
              <Badge className={getMetadataStatusColor(entry.metadataStatus)}>
                {entry.metadataStatus}
              </Badge>
              {entry.metadataSource && (
                <p className="text-xs text-muted-foreground">
                  Source: {entry.metadataSource}
                </p>
              )}
              {entry.lastMetadataRefresh && (
                <p className="text-xs text-muted-foreground">
                  Last refreshed:{' '}
                  {new Date(entry.lastMetadataRefresh).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Description */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {entry.title}
            </h1>
            {entry.personalRating && (
              <div className="text-2xl text-accent mb-4">
                ★ {entry.personalRating}/5
              </div>
            )}
            {entry.description && (
              <p className="text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
            )}
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4">
            {entry.releaseDate && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar size={16} />
                  <span className="text-xs">Release Date</span>
                </div>
                <p className="font-semibold text-foreground">
                  {new Date(entry.releaseDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {entry.engine && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap size={16} />
                  <span className="text-xs">Engine</span>
                </div>
                <p className="font-semibold text-foreground">{entry.engine}</p>
              </div>
            )}
            {entry.version && (
              <div className="bg-card rounded-lg border border-border p-4">
                <span className="text-xs text-muted-foreground">Version</span>
                <p className="font-semibold text-foreground">{entry.version}</p>
              </div>
            )}
            {entry.storageDevice && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen size={16} />
                  <span className="text-xs">Storage</span>
                </div>
                <p className="font-semibold text-accent">
                  {entry.storageDevice}
                </p>
              </div>
            )}
          </div>

          {/* Genres & Platforms */}
          <div className="space-y-4">
            {entry.genres.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {entry.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.platforms.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Platforms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {entry.platforms.map((platform) => (
                    <Badge key={platform} variant="outline">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Developers & Publishers */}
          {(developers.length > 0 || publishers.length > 0) && (
            <div className="space-y-4">
              {developers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Developers
                  </h3>
                  <div className="space-y-2">
                    {developers.map((dev) => (
                      <Link
                        key={dev.id}
                        href={`/developers/${dev.id}`}
                        className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                      >
                        <p className="font-medium text-foreground">{dev.name}</p>
                        {dev.country && (
                          <p className="text-xs text-muted-foreground">
                            {dev.country}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {publishers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Publishers
                  </h3>
                  <div className="space-y-2">
                    {publishers.map((pub) => (
                      <Link
                        key={pub.id}
                        href={`/publishers/${pub.id}`}
                        className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                      >
                        <p className="font-medium text-foreground">{pub.name}</p>
                        {pub.country && (
                          <p className="text-xs text-muted-foreground">
                            {pub.country}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Archive Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Archive Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Path:</span>
                <code className="text-accent font-mono text-xs">
                  {entry.filePath}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Archive Type:</span>
                <span className="font-medium text-foreground">
                  {entry.archiveType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Verified:</span>
                <span className="font-medium text-foreground">
                  {new Date(entry.lastVerified).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {entry.artwork?.screenshots && entry.artwork.screenshots.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entry.artwork.screenshots.map((screenshot, index) => (
              <div
                key={index}
                className="rounded-lg overflow-hidden border border-border"
              >
                <img
                  src={screenshot}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
