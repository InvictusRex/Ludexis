import type { ArchiveEntry } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/format";
import { MetadataMark, VerificationMark } from "@/components/media/status-mark";
import { libraryHref } from "@/components/library/library-params";
import { ChipLink } from "./game-hero";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 border-b border-seam/60 py-2.5 last:border-0">
      <dt className="text-sm text-ash">{label}</dt>
      <dd className="min-w-0 text-parchment">{children}</dd>
    </div>
  );
}

function Links({ title, items, quiet }: { title: string; items: { href: string; name: string }[]; quiet?: boolean }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-ash">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <ChipLink key={item.href} href={item.href} quiet={quiet}>
            {item.name}
          </ChipLink>
        ))}
      </div>
    </div>
  );
}

const linksOf = (base: string, items?: { id: string; name: string }[]) =>
  (items ?? []).map((item) => ({ href: `${base}/${item.id}`, name: item.name }));

export function GameOverview({ entry }: { entry: ArchiveEntry }) {
  const confidence = entry.metadata_confidence;
  const related = [...(entry.parent_series ? [entry.parent_series] : []), ...(entry.related_entries ?? [])];
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div data-mask className="space-y-6">
        <section aria-labelledby="game-about">
          <h2 id="game-about" className="mb-3 font-display text-xl font-semibold text-parchment">
            About
          </h2>
          {entry.description ? (
            <p className="whitespace-pre-line leading-relaxed text-parchment/90">{entry.description}</p>
          ) : (
            <p className="text-ash">No description yet. Identifying the game fills one in, or it can be written by hand.</p>
          )}
        </section>
        <Links title="Developers" items={linksOf("/developers", entry.developers)} />
        <Links title="Publishers" items={linksOf("/publishers", entry.publishers)} />
        <Links title="Franchise" items={linksOf("/franchises", entry.franchise ? [entry.franchise] : [])} />
        <Links title="Collections" items={linksOf("/collections", entry.collections)} />
        <Links title="Related games" items={related.map((game) => ({ href: `/archive/${game.id}`, name: game.title }))} />
        <Links title="Genres" items={(entry.genres ?? []).map((genre) => ({ href: libraryHref({ genre }), name: genre }))} />
      </div>

      <dl className="lg:pt-1">
        <Detail label="Release date">{formatDate(entry.release_date)}</Detail>
        {(entry.season != null || entry.episode != null) && (
          <Detail label="Series">
            {[entry.season != null && `Season ${entry.season}`, entry.episode != null && `Episode ${entry.episode}`]
              .filter(Boolean)
              .join(" · ")}
          </Detail>
        )}
        {entry.engine && <Detail label="Engine">{entry.engine}</Detail>}
        {entry.version && <Detail label="Version">{entry.version}</Detail>}
        {entry.archive_type && <Detail label="Archive type">{entry.archive_type}</Detail>}
        {entry.file_size != null && (
          <Detail label="Size">
            <span className="tabular">{formatBytes(entry.file_size)}</span>
          </Detail>
        )}
        <Detail label="Path">
          <code className="break-all font-mono text-sm">{entry.file_path}</code>
        </Detail>
        <Detail label="Metadata">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <MetadataMark status={entry.metadata_status} source={entry.metadata_source} />
            {confidence != null && entry.metadata_status !== "MANUAL" && (
              <span className="text-sm tabular text-ash">{Math.round(confidence * 100)}% confidence</span>
            )}
          </span>
        </Detail>
        <Detail label="File">
          <VerificationMark status={entry.verification_status} />
        </Detail>
        <Detail label="Added">{formatDate(entry.created_at)}</Detail>
      </dl>
    </div>
  );
}

export function GameFiles({ entry }: { entry: ArchiveEntry }) {
  return (
    <dl className="max-w-3xl">
      <Detail label="Path">
        <code className="break-all font-mono text-sm">{entry.file_path}</code>
      </Detail>
      {entry.relative_path && (
        <Detail label="In library">
          <code className="break-all font-mono text-sm">{entry.relative_path}</code>
        </Detail>
      )}
      <Detail label="Size">
        <span className="tabular">{formatBytes(entry.file_size) ?? "—"}</span>
      </Detail>
      <Detail label="Hash">
        <code className="break-all font-mono text-sm text-parchment/85">{entry.file_hash ?? "—"}</code>
      </Detail>
      {entry.archive_type && <Detail label="Archive type">{entry.archive_type}</Detail>}
      {entry.storage_device && <Detail label="Storage device">{entry.storage_device}</Detail>}
      {entry.library_status && (
        <Detail label="Library">{entry.library_status === "ONLINE" ? "Online" : "Offline: drive or folder not connected"}</Detail>
      )}
      <Detail label="Verification">
        <VerificationMark status={entry.verification_status} />
      </Detail>
      <Detail label="Last checked">{formatDate(entry.last_verified)}</Detail>
      <Detail label="File modified">{formatDate(entry.modified_time)}</Detail>
    </dl>
  );
}
