import Link from "next/link";
import type { Franchise } from "@/lib/types";
import { plural } from "@/lib/format";
import { Shot } from "@/components/media/art";

/** A franchise card's width, the same in the home row and on the franchises page. */
export const FRANCHISE_CARD_WIDTH = "w-[220px] sm:w-[260px]";

/** The franchise's image (chosen, or one of its games' banners) with its name over it. */
export function FranchiseCard({ franchise }: { franchise: Pick<Franchise, "id" | "name" | "image_path" | "entry_count"> }) {
  return (
    <Link href={`/franchises/${franchise.id}`} className="group block rounded-md outline-none">
      <div className="relative rounded-md transition-shadow group-hover:shadow-[0_0_0_1px_var(--violet-lit)] group-focus-visible:shadow-[0_0_0_2px_var(--violet-lit)]">
        <Shot path={franchise.image_path} alt="" className="bg-[radial-gradient(120%_120%_at_30%_20%,rgb(91_53_163/0.45),var(--stone)_70%)]" />
        <div className="absolute inset-0 flex items-end rounded-md bg-gradient-to-t from-night/90 via-night/30 to-transparent p-3">
          <span className="line-clamp-2 font-display text-base font-semibold text-parchment">{franchise.name}</span>
        </div>
      </div>
      <p className="mt-2 px-0.5 text-xs tabular text-ash">{plural(franchise.entry_count, "game")}</p>
    </Link>
  );
}
