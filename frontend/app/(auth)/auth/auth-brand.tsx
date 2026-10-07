import { cn } from "@/lib/utils";

/** The knight over the carved name, shared by sign-in and first-run setup. */
export function AuthBrand({ knightClassName }: { knightClassName?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center text-center">
      <img
        src="/brand/knight.webp"
        alt=""
        width={579}
        height={565}
        fetchPriority="high"
        className={cn("h-auto w-40", knightClassName)}
      />
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-[0.08em] text-parchment">Ludexis</h1>
      <p className="mt-2 text-sm tracking-wide text-ash">Catalog · Enrich · Preserve</p>
    </div>
  );
}
