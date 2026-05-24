import Link from 'next/link'
import { ArchiveEntry } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface ArchiveEntryCardProps {
  entry: ArchiveEntry
}

export function ArchiveEntryCard({ entry }: ArchiveEntryCardProps) {
  const getMetadataStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return 'bg-green-900 text-green-200'
      case 'PARTIAL':
        return 'bg-yellow-900 text-yellow-200'
      case 'UNMATCHED':
        return 'bg-red-900 text-red-200'
      case 'MANUAL':
        return 'bg-blue-900 text-blue-200'
      default:
        return 'bg-gray-900 text-gray-200'
    }
  }

  return (
    <Link href={`/archive/${entry.id}`}>
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer h-full flex flex-col">
        {/* Cover Art */}
        <div className="relative w-full aspect-[2/3] bg-muted overflow-hidden">
          {entry.artwork?.coverArt ? (
            <img
              src={entry.artwork.coverArt}
              alt={entry.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No Cover</span>
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${getMetadataStatusColor(entry.metadataStatus)}`}>
            {entry.metadataStatus}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground line-clamp-2 mb-2">{entry.title}</h3>

          {/* Status Badge */}
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {entry.status}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 flex-1">
            {entry.releaseDate && (
              <p>{new Date(entry.releaseDate).getFullYear()}</p>
            )}
            {entry.platforms.length > 0 && (
              <p>{entry.platforms.slice(0, 2).join(', ')}</p>
            )}
            {entry.storageDevice && (
              <p className="text-accent">{entry.storageDevice}</p>
            )}
          </div>

          {/* Rating */}
          {entry.personalRating && (
            <div className="mt-2 text-accent text-sm">
              ★ {entry.personalRating}/5
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
