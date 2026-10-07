"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl font-semibold text-parchment">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-sm text-ash">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export type Tone = "ok" | "bad" | "busy" | "idle";

const TONES: Record<Tone, string> = {
  ok: "bg-moss",
  bad: "bg-ember",
  busy: "bg-violet-lit motion-safe:animate-pulse",
  idle: "bg-ash/60",
};

export function StatusDot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-2 shrink-0 rounded-full", TONES[tone], className)} />;
}

/** A dot plus a word, e.g. "● Online". */
export function Status({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-parchment", className)}>
      <StatusDot tone={tone} />
      {children}
    </span>
  );
}

const JOB_STATUS: Record<string, [string, Tone]> = {
  PENDING: ["Queued", "idle"],
  RUNNING: ["Running", "busy"],
  SUCCESS: ["Done", "ok"],
  FAILED: ["Failed", "bad"],
  CANCELED: ["Canceled", "idle"],
};

export function JobStatus({ status }: { status?: string | null }) {
  if (!status) {
    return <span className="text-sm text-ash">—</span>;
  }
  const [label, tone] = JOB_STATUS[status] ?? [humanize(status), "idle"];
  return <Status tone={tone}>{label}</Status>;
}

export function isActiveJob(status?: string | null) {
  return status === "PENDING" || status === "RUNNING";
}

/** "LOGIN_SUCCESS" → "Login success". */
export function humanize(value: string): string {
  const words = value.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function dateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Lists without a total count are fetched one row past the page to know whether more exist. */
export function splitPage<T>(rows: T[], size: number): { rows: T[]; hasMore: boolean } {
  return { rows: rows.slice(0, size), hasMore: rows.length > size };
}

export function Pager({ page, hasMore, onPage }: { page: number; hasMore: boolean; onPage: (page: number) => void }) {
  if (page === 1 && !hasMore) {
    return null;
  }
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-end gap-2">
      <span className="tabular mr-2 text-sm text-ash">Page {page}</span>
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft />
        Previous
      </Button>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => onPage(page + 1)}>
        Next
        <ChevronRight />
      </Button>
    </nav>
  );
}

/** The active tab lives in `?tab=` so other pages can deep-link to it. */
export function useTabParam<T extends string>(tabs: readonly T[], fallback: T) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = params.get("tab") as T | null;
  const tab = requested && tabs.includes(requested) ? requested : fallback;
  const setTab = (next: string) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  return [tab, setTab] as const;
}

/** A native select dressed like the other fields; native keeps it simple and accessible. */
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-seam bg-night/50 px-2 text-sm text-parchment outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
