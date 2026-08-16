import Link from "next/link";
import { Tag } from "@/lib/types";

interface TagCardProps {
  tag: Tag;
}

export function TagCard({ tag }: TagCardProps) {
  return (
    <Link href={`/tags/${tag.id}`}>
      <div
        className="group bg-card rounded-lg overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer h-full flex flex-col p-4"
        style={{
          borderLeftColor: tag.color || "rgb(var(--color-border))",
          borderLeftWidth: "4px",
        }}
      >
        <h3 className="font-bold text-foreground line-clamp-2 mb-1">
          {tag.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {tag.description || "No description"}
        </p>

        <div className="text-sm font-semibold text-accent">
          {tag.entry_count} {tag.entry_count === 1 ? "entry" : "entries"}
        </div>
      </div>
    </Link>
  );
}
