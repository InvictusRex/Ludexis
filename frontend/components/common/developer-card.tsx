import Link from "next/link";
import { Developer } from "@/lib/types";

interface DeveloperCardProps {
  developer: Developer;
}

export function DeveloperCard({ developer }: DeveloperCardProps) {
  return (
    <Link href={`/developers/${developer.id}`}>
      <div className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer h-full flex flex-col">
        {/* Banner */}
        <div className="relative w-full aspect-video bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">No Banner</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground line-clamp-1 mb-1">
            {developer.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
            {developer.description || "No description"}
          </p>

          {/* Stats (entry count not provided by backend) */}
          <div className="flex items-center justify-between text-xs text-foreground">
            <span className="font-semibold text-accent">0</span>
            <span className="text-muted-foreground">archive entries</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
