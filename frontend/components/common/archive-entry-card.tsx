import Link from "next/link";
import { ArchiveEntry, VerificationStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface ArchiveEntryCardProps {
  entry: ArchiveEntry;
}

const getStatusColor = (status: VerificationStatus) => {
  switch (status) {
    case "VERIFIED":
      return "bg-green-900 text-green-200";
    case "MISSING":
      return "bg-yellow-900 text-yellow-200";
    case "MOVED":
      return "bg-blue-900 text-blue-200";
    case "CORRUPTED":
      return "bg-red-900 text-red-200";
    case "UNKNOWN":
    default:
      return "bg-gray-900 text-gray-200";
  }
};

export function ArchiveEntryCard({ entry }: ArchiveEntryCardProps) {
  return (
    <Link href={`/archive/${entry.id}`}>
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer h-full flex flex-col">
        {/* Cover Art */}
        <div className="relative w-full aspect-[2/3] bg-muted overflow-hidden">
          {entry.cover_path ? (
            <img
              src={entry.cover_path}
              alt={entry.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No Cover</span>
            </div>
          )}
          <Badge
            className={`absolute top-2 right-2 ${getStatusColor(entry.verification_status)}`}
          >
            {entry.verification_status}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground line-clamp-2 mb-2">
            {entry.title}
          </h3>

          {/* Verification Badge */}
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {entry.verification_status}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1 flex-1">
            {entry.release_date && (
              <p>{new Date(entry.release_date).getFullYear()}</p>
            )}
            {entry.storage_device && (
              <p className="text-accent">{entry.storage_device}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
