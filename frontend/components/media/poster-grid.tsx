import { cn } from "@/lib/utils";

export type Density = "comfortable" | "compact";

// At least three columns on a phone; otherwise posters settle around their preferred width.
const COLUMN = {
  comfortable: "repeat(auto-fill, minmax(min(168px, 30%), 1fr))",
  compact: "repeat(auto-fill, minmax(min(124px, 30%), 1fr))",
};

export function PosterGrid({
  children,
  density = "comfortable",
  className,
}: {
  children: React.ReactNode;
  density?: Density;
  className?: string;
}) {
  return (
    <div
      className={cn("grid gap-x-4 gap-y-6 sm:gap-x-5 sm:gap-y-8", className)}
      style={{ gridTemplateColumns: COLUMN[density] }}
    >
      {children}
    </div>
  );
}

export function PosterSkeletons({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true">
          <div className="aspect-[2/3] animate-pulse rounded-md bg-stone" />
          <div className="mt-2.5 h-3.5 w-3/4 animate-pulse rounded bg-stone" />
          <div className="mt-2 h-3 w-1/4 animate-pulse rounded bg-stone" />
        </div>
      ))}
    </>
  );
}
