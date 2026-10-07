import { cn } from "@/lib/utils";
import { Backdrop } from "./art";

const HEIGHT = {
  detail: "min-h-[clamp(360px,58vh,660px)]",
  spotlight: "min-h-[clamp(300px,46vh,480px)]",
  banner: "min-h-[clamp(220px,32vh,340px)]",
};

interface BackdropHeroProps {
  banner?: string | null;
  /** Blurred in when there is no banner. */
  cover?: string | null;
  size?: keyof typeof HEIGHT;
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-bleed artwork that runs up under the translucent top bar, darkened toward the
 * bottom and the reading side so the content placed on it always stays legible.
 */
export function BackdropHero({ banner, cover, size = "detail", children, className }: BackdropHeroProps) {
  return (
    <section className={cn("relative isolate -mt-(--topbar-h) flex flex-col justify-end", HEIGHT[size], className)}>
      <Backdrop path={banner} fallbackPath={cover} />
      <div aria-hidden="true" className="absolute inset-0 [background:var(--scrim)]" />
      <div aria-hidden="true" className="absolute inset-0 [background:var(--scrim-side)]" />
      <div className="relative px-(--gutter) pb-8 pt-[calc(var(--topbar-h)+2rem)]">{children}</div>
    </section>
  );
}
