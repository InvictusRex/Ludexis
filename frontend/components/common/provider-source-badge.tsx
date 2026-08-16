import { Badge } from "@/components/ui/badge";

interface ProviderSourceBadgeProps {
  source?: string | null;
  sourceCode?: string | null;
}

export function ProviderSourceBadge({
  source,
  sourceCode,
}: ProviderSourceBadgeProps) {
  if (!source) {
    return null;
  }

  return (
    <Badge variant="secondary" title={sourceCode ?? undefined}>
      {source}
    </Badge>
  );
}
