"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const POSTER_RATIO = 2 / 3;
// Covers further than this from 2:3 (a landscape Steam header, say) are fitted, not cropped.
const POSTER_TOLERANCE = 0.15;

type Loading = "lazy" | "eager";

interface ArtProps {
  path?: string | null;
  alt: string;
  className?: string;
  loading?: Loading;
}

function useArt(path?: string | null, onImage?: (image: HTMLImageElement) => void) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const src = failed ? undefined : mediaUrl(path);
  const handle = (image: HTMLImageElement) => {
    onImage?.(image);
    setLoaded(true);
  };
  return {
    src,
    loaded,
    onLoad: (event: React.SyntheticEvent<HTMLImageElement>) => handle(event.currentTarget),
    onError: () => setFailed(true),
    // A cached image can finish before React attaches onLoad; catch that case too.
    attach: (image: HTMLImageElement | null) => {
      if (image?.complete && image.naturalWidth > 0) {
        handle(image);
      }
    },
  };
}

/** A missing cover: the shield on a violet glow, with the title set in Cinzel. */
export function PosterPlaceholder({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={cn(
        "@container absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_80%_at_50%_25%,rgb(91_53_163/0.55),var(--stone)_70%)] p-3 text-center",
        className,
      )}
    >
      <img src="/brand/shield.png" alt="" width={56} height={56} className="w-[34%] max-w-16 opacity-90" />
      {/* Thumbnails are too small for a readable title; the shield alone says "no cover". */}
      <span className="hidden @min-[5.5rem]:block">
        <span data-mask className="line-clamp-3 font-display text-[0.8rem] font-semibold leading-snug text-parchment/90">{title}</span>
      </span>
    </div>
  );
}

/** A 2:3 cover, centred. Off-ratio covers sit whole over a blurred copy of themselves. */
export function Poster({ path, alt, className, loading = "lazy" }: ArtProps) {
  const [fit, setFit] = useState(false);
  const { src, loaded, onLoad, onError, attach } = useArt(path, (image) => {
    const ratio = image.naturalWidth / image.naturalHeight;
    setFit(Math.abs(ratio - POSTER_RATIO) / POSTER_RATIO > POSTER_TOLERANCE);
  });

  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-md bg-stone", className)}>
      {src ? (
        <>
          {fit && (
            <img
              src={src}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full scale-125 object-cover object-center opacity-60 blur-xl"
            />
          )}
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding="async"
            ref={attach}
            onLoad={onLoad}
            onError={onError}
            className={cn(
              "absolute inset-0 size-full object-center transition-opacity duration-300",
              fit ? "object-contain" : "object-cover",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : (
        <PosterPlaceholder title={alt} />
      )}
    </div>
  );
}

interface BackdropProps {
  /** The banner. */
  path?: string | null;
  /** Used blurred and enlarged when there is no banner, so a hero is never empty. */
  fallbackPath?: string | null;
  className?: string;
}

/** Fills its (positioned) parent with a centred banner, or a blurred cover, or a violet glow. */
export function Backdrop({ path, fallbackPath, className }: BackdropProps) {
  const { src: bannerSrc, loaded: bannerLoaded, onLoad: onBannerLoad, onError: onBannerError, attach: attachBanner } = useArt(path);
  const { src: coverSrc, loaded: coverLoaded, onLoad: onCoverLoad, onError: onCoverError, attach: attachCover } = useArt(fallbackPath);

  return (
    <div aria-hidden="true" className={cn("absolute inset-0 overflow-hidden bg-night", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_70%_20%,rgb(91_53_163/0.35),transparent_70%)]" />
      {bannerSrc ? (
        <img
          src={bannerSrc}
          alt=""
          decoding="async"
          ref={attachBanner}
          onLoad={onBannerLoad}
          onError={onBannerError}
          className={cn(
            "absolute inset-0 size-full object-cover object-center transition-opacity duration-700",
            bannerLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      ) : (
        coverSrc && (
          <img
            src={coverSrc}
            alt=""
            decoding="async"
            ref={attachCover}
            onLoad={onCoverLoad}
            onError={onCoverError}
            className={cn(
              "absolute inset-0 size-full scale-125 object-cover object-center blur-2xl transition-opacity duration-700",
              coverLoaded ? "opacity-55" : "opacity-0",
            )}
          />
        )
      )}
    </div>
  );
}

/** Title art (a game logo). Renders nothing when missing so the caller can show text instead. */
export function Logo({
  path,
  alt,
  className,
  fallback,
}: ArtProps & { fallback: React.ReactNode }) {
  const art = useArt(path);
  if (!art.src) {
    return <>{fallback}</>;
  }
  return (
    <img
      src={art.src}
      alt={alt}
      decoding="async"
      onError={art.onError}
      className={cn("max-h-28 max-w-[min(28rem,80%)] object-contain object-left-bottom drop-shadow-[0_4px_24px_rgb(0_0_0/0.6)]", className)}
    />
  );
}

/** A 16:9 screenshot or banner tile, centred and cropped. */
export function Shot({ path, alt, className, loading = "lazy" }: ArtProps) {
  const { src, loaded, onLoad, onError, attach } = useArt(path);
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-md bg-stone", className)}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          ref={attach}
          onLoad={onLoad}
          onError={onError}
          className={cn(
            "absolute inset-0 size-full object-cover object-center transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
