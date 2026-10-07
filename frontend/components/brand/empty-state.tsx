import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** A whole-screen state (not found, crashed): the knight at full size instead of a faint stamp. */
  prominent?: boolean;
}

// The knight stands watch over every empty or failed view.
export function EmptyState({ title, description, action, className, prominent }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <img
        src="/brand/knight.webp"
        alt=""
        width={579}
        height={565}
        className={cn("mb-6", prominent ? "w-[200px] sm:w-[260px]" : "w-[132px] opacity-60")}
      />
      <h2 className="font-display text-xl font-semibold text-parchment">{title}</h2>
      {description && <p className="mt-2 max-w-md text-ash">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
