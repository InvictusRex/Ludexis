"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Section } from "./sections";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** A tab strip on small screens, a vertical list beside the content on large ones. */
export function SectionNav({ sections }: { sections: Section[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard sections" className="-mx-(--gutter) lg:mx-0 lg:sticky lg:top-[calc(var(--topbar-h)+1.5rem)] lg:self-start">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto border-b border-seam px-(--gutter) lg:flex-col lg:border-0 lg:px-0">
        {sections.map((section) => {
          const active = isActive(pathname, section.href);
          const Icon = section.icon;
          return (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-2.5 px-3 text-[0.9375rem] font-medium whitespace-nowrap transition-colors",
                  "-mb-px border-b-2 lg:mb-0 lg:h-10 lg:rounded-lg lg:border-0",
                  active
                    ? "border-violet-lit text-parchment lg:bg-stone"
                    : "border-transparent text-ash hover:text-parchment lg:hover:bg-stone/60",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 hidden h-4 w-[3px] -translate-y-1/2 rounded-full bg-spark lg:block"
                  />
                )}
                <Icon className={cn("size-[18px] shrink-0", active && "text-violet-lit")} />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
