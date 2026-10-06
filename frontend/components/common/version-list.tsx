import Link from "next/link";
import type { ArchiveEntry } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

/** Every version of one game, newest first; the version being viewed is highlighted. */
export function VersionList({
  versions,
  currentId,
}: {
  versions: ArchiveEntry[];
  currentId: string;
}) {
  if (versions.length < 2) return null;
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">
        Versions ({versions.length})
      </h3>
      <ul className="space-y-2 text-sm">
        {versions.map((version) => (
          <li key={version.id}>
            <Link
              href={`/archive/${version.id}`}
              className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border transition-colors hover:border-accent ${
                version.id === currentId ? "border-accent" : "border-border"
              }`}
            >
              <span className="font-medium text-foreground">
                {version.version ? `v${version.version}` : "Unversioned"}
              </span>
              <code className="text-muted-foreground font-mono text-xs break-all">
                {version.file_path}
              </code>
              <span className="flex items-center gap-2">
                {version.file_size != null && (
                  <span className="text-muted-foreground">
                    {(version.file_size / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
                <Badge variant="secondary" className="text-xs">
                  {version.verification_status}
                </Badge>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
