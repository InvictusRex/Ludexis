import Link from 'next/link'
import { Collection } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

interface CollectionCardProps {
  collection: Collection
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer h-full flex flex-col">
        {/* Banner/Cover Art */}
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {collection.artwork?.bannerArt ? (
            <img
              src={collection.artwork.bannerArt}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : collection.artwork?.coverArt ? (
            <img
              src={collection.artwork.coverArt}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-muted-foreground">No Artwork</span>
            </div>
          )}
          {collection.isFeatured && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground line-clamp-2 mb-2">{collection.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {collection.description || 'No description'}
          </p>

          {/* Entry Count & Visibility */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{collection.entries.length} entries</span>
            <span className="capitalize">{collection.visibility}</span>
          </div>

          {/* Tags */}
          {collection.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {collection.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collection.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{collection.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
