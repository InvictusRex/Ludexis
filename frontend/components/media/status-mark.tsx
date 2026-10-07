import type { MetadataStatus, VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const METADATA: Record<MetadataStatus, { label: string; tone: string }> = {
  MATCHED: { label: "Matched", tone: "text-spark" },
  MANUAL: { label: "Edited by hand", tone: "text-violet-lit" },
  PARTIAL: { label: "Partly matched", tone: "text-ash" },
  UNMATCHED: { label: "Not identified", tone: "text-ember" },
};

const VERIFICATION: Record<VerificationStatus, { label: string; dot: string }> = {
  VERIFIED: { label: "File verified", dot: "bg-moss" },
  MISSING: { label: "File missing", dot: "bg-ember" },
  CORRUPTED: { label: "File corrupted", dot: "bg-ember" },
  MOVED: { label: "File moved", dot: "bg-spark" },
  UNKNOWN: { label: "Not checked yet", dot: "bg-ash/60" },
};

/** ✦ Matched · VNDB. The sparkle is the one place amber marks a game. */
export function MetadataMark({
  status,
  source,
  className,
}: {
  status: MetadataStatus;
  source?: string | null;
  className?: string;
}) {
  const meta = METADATA[status] ?? METADATA.UNMATCHED;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", meta.tone, className)}>
      {status === "MATCHED" ? (
        <span aria-hidden="true">✦</span>
      ) : (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {meta.label}
      {source && status !== "UNMATCHED" && <span className="font-normal text-ash">from {source}</span>}
    </span>
  );
}

export function VerificationMark({ status, className }: { status: VerificationStatus; className?: string }) {
  const meta = VERIFICATION[status] ?? VERIFICATION.UNKNOWN;
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-ash", className)}>
      <span aria-hidden="true" className={cn("size-2 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export const metadataLabel = (status: MetadataStatus) => (METADATA[status] ?? METADATA.UNMATCHED).label;
export const verificationLabel = (status: VerificationStatus) => (VERIFICATION[status] ?? VERIFICATION.UNKNOWN).label;
