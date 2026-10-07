import Link from "next/link";
import type { ArchiveEntry } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";
import { VerificationMark } from "@/components/media/status-mark";
import { cn } from "@/lib/utils";

/** Every version of one game; the one being viewed is marked as current. */
export function VersionList({ versions, currentId }: { versions: ArchiveEntry[]; currentId: string }) {
  if (versions.length < 2) return null;
  return (
    <ul className="divide-y divide-seam overflow-hidden rounded-lg border border-seam">
      {versions.map((version) => {
        const current = version.id === currentId;
        return (
          <li key={version.id}>
            <Link
              href={`/archive/${version.id}`}
              aria-current={current ? "page" : undefined}
              className={cn(
                "grid gap-x-6 gap-y-1 px-4 py-3 outline-none transition-colors hover:bg-vault focus-visible:bg-vault sm:grid-cols-[10rem_1fr_auto] sm:items-center",
                current && "bg-vault",
              )}
            >
              <span className="flex items-center gap-2 font-medium text-parchment">
                {version.version ? `v${version.version}` : "Unversioned"}
                {current && <span className="rounded-full bg-violet/40 px-2 py-0.5 text-xs text-parchment">Viewing</span>}
              </span>
              <code className="min-w-0 break-all font-mono text-xs text-ash">{version.file_path}</code>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ash">
                {version.file_size != null && <span className="tabular">{formatBytes(version.file_size)}</span>}
                <span>Added {formatDate(version.created_at)}</span>
                <VerificationMark status={version.verification_status} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
