import Link from "next/link";
import { Collection } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { mediaUrl } from "@/lib/media";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer h-full flex flex-col">
        {/* Banner/Cover Art */}
        <div className="relative w-full aspect-video bg-muted overflow-hidden">
          {collection.banner_path ? (
            <img
              src={mediaUrl(collection.banner_path)}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : collection.cover_path ? (
            <img
              src={mediaUrl(collection.cover_path)}
              alt={collection.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-muted-foreground">No Artwork</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground line-clamp-2 mb-2">
            {collection.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {collection.description || "No description"}
          </p>

          {/* Entry Count & Visibility */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {collection.entry_ids ? collection.entry_ids.length : 0} entries
            </span>
            <span className="capitalize">{collection.visibility}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
