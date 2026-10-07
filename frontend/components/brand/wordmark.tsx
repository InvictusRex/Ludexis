import { cn } from "@/lib/utils";

// The "L" shield and the carved Cinzel name, as on the Ludexis crest.
export function Wordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img src="/brand/shield.png" alt="" width={34} height={34} className="size-[34px] shrink-0" />
      {!compact && (
        <span className="font-display text-[1.35rem] font-semibold leading-none tracking-[0.06em] text-parchment">
          Ludexis
        </span>
      )}
    </span>
  );
}
