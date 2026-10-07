import { cn } from "@/lib/utils";

/** Standard page padding; full-bleed heroes sit outside it. */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-(--gutter) pb-16 pt-6", className)}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  /** Buttons aligned to the right of the title. */
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold text-parchment">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-ash">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
