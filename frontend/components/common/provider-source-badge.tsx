interface ProviderSourceBadgeProps {
  source?: string | null;
  sourceCode?: string | null;
}

/** The metadata provider a game was matched from; the provider's id shows on hover. */
export function ProviderSourceBadge({ source, sourceCode }: ProviderSourceBadgeProps) {
  if (!source) {
    return null;
  }

  return (
    <span
      title={sourceCode ?? undefined}
      className="inline-flex items-center rounded-full border border-seam px-2 py-0.5 text-xs font-medium text-ash"
    >
      {source}
    </span>
  );
}
