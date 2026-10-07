"use client";

import { Children, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShelfProps {
  title: string;
  /** "See all" destination, usually a pre-filtered library. */
  href?: string;
  children: React.ReactNode;
  /** Width of each item; posters by default. */
  itemClassName?: string;
}

/** A horizontal row that scrolls by snap, with arrows on pointer devices. */
export function Shelf({ title, href, children, itemClassName = "w-[132px] sm:w-[156px]" }: ShelfProps) {
  const rail = useRef<HTMLDivElement>(null);
  const page = (direction: 1 | -1) =>
    rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="py-4">
      <div className="mb-3 flex items-end justify-between gap-4 px-(--gutter)">
        <h2 className="font-display text-lg font-semibold text-parchment">{title}</h2>
        <div className="flex items-center gap-1">
          {href && (
            <Link href={href} className="mr-2 text-sm font-medium text-violet-lit hover:text-parchment">
              See all
            </Link>
          )}
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label={`Scroll ${title} back`}
            className="hidden size-8 place-items-center rounded-full text-ash hover:bg-stone hover:text-parchment [@media(pointer:fine)]:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label={`Scroll ${title} forward`}
            className="hidden size-8 place-items-center rounded-full text-ash hover:bg-stone hover:text-parchment [@media(pointer:fine)]:grid"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={rail}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter) px-(--gutter) pb-3 pt-1 sm:gap-5"
      >
        {Children.map(children, (child) => (
          <div className={cn("shrink-0 snap-start", itemClassName)}>{child}</div>
        ))}
      </div>
    </section>
  );
}
