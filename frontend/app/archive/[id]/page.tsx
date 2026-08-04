"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArchiveEntry, Developer, Publisher, Screenshot } from "@/lib/types";
import { archiveApi, developersApi, publishersApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotGallery } from "@/components/common/screenshot-gallery";
import { ProviderSourceBadge } from "@/components/common/provider-source-badge";
import { MetadataHistoryCard } from "@/components/common/metadata-history-card";
import { MetadataComparison } from "@/components/common/metadata-comparison";
import { MetadataAuditTrail } from "@/components/common/metadata-audit-trail";
import { ArtworkQualityIndicators } from "@/components/common/artwork-quality-indicators";
import { ArtworkComparisonDialog } from "@/components/common/artwork-comparison-dialog";
import { ArtworkVersionHistory } from "@/components/common/artwork-version-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mediaUrl } from "@/lib/media";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  Edit,
  Share2,
  Heart,
  Download,
  FolderOpen,
  Calendar,
  Zap,
  Trash2,
} from "lucide-react";

export default function ArchiveDetailsPage() {
  const params = useParams();
  const entryId = params.id as string;
  const router = useRouter();

  const [entry, setEntry] = useState<ArchiveEntry | null>(null);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this archive entry?")) {
      return;
    }
    try {
      await archiveApi.delete(entryId);
      toastSuccess("Archive entry deleted");
      router.push("/library");
    } catch (error) {
      toastError(error, "Failed to delete entry");
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadDetails = async () => {
      if (!user) {
        return;
      }

      try {
        const data = await archiveApi.getById(entryId);
        if (!data) {
          setEntry(null);
          return;
        }

        setEntry(data);

        // Load related developers and publishers
        const devs = await Promise.all(
          data.developer_ids.map((id) => developersApi.getById(id)),
        );
        const pubs = await Promise.all(
          data.publisher_ids.map((id) => publishersApi.getById(id)),
        );

        setDevelopers(devs.filter(Boolean) as Developer[]);
        setPublishers(pubs.filter(Boolean) as Publisher[]);

        try {
          setScreenshots(await archiveApi.getScreenshots(entryId));
        } catch {
          setScreenshots([]);
        }
      } catch (error) {
        console.error("Failed to load archive details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [entryId, authLoading, user]);

  if (authLoading || loading) {
    return <div className="h-96 bg-card rounded-lg animate-pulse" />;
  }

  if (!entry) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Entry not found
        </h1>
        <Link href="/library">
          <Button>Back to Library</Button>
        </Link>
      </div>
    );
  }

  const confidencePct =
    entry.metadata_confidence != null
      ? Math.round(entry.metadata_confidence * 100)
      : null;

  const getMetadataStatusColor = (status: string) => {
    switch (status) {
      case "MATCHED":
        return "bg-green-900 text-green-200 border-green-700";
      case "PARTIAL":
        return "bg-yellow-900 text-yellow-200 border-yellow-700";
      case "UNMATCHED":
        return "bg-red-900 text-red-200 border-red-700";
      case "MANUAL":
        return "bg-blue-900 text-blue-200 border-blue-700";
      default:
        return "bg-gray-900 text-gray-200 border-gray-700";
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/library" className="hover:text-accent">
          Library
        </Link>
        <span>/</span>
        <span>{entry.title}</span>
      </div>

      {/* Header with Banner */}
      {entry.banner_path && (
        <div className="w-full h-64 rounded-lg overflow-hidden border border-border">
          <img
            src={mediaUrl(entry.banner_path)}
            alt={entry.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Cover & Info */}
        <div className="space-y-6">
          {/* Cover Art */}
          {entry.cover_path && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={mediaUrl(entry.cover_path)}
                alt={entry.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              className="w-full"
              variant="default"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart size={18} className={isFavorited ? "fill-current" : ""} />
              {isFavorited ? "Favorited" : "Add to Favorites"}
            </Button>
            <Button className="w-full" variant="outline">
              <Edit size={18} />
              Edit Entry
            </Button>
            <Button className="w-full" variant="outline">
              <Share2 size={18} />
              Share
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 size={18} />
              Delete Entry
            </Button>
          </div>

          {/* Metadata Status */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground mb-3">
              Metadata Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getMetadataStatusColor(entry.metadata_status)}>
                  {entry.metadata_status}
                </Badge>
                <ProviderSourceBadge
                  source={entry.metadata_source}
                  sourceCode={entry.metadata_source_code}
                />
              </div>
              {confidencePct != null && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Match confidence: {confidencePct}%
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>
              )}
              {entry.metadata_source && (
                <p className="text-xs text-muted-foreground">
                  Source: {entry.metadata_source}
                </p>
              )}
              {entry.last_metadata_refresh && (
                <p className="text-xs text-muted-foreground">
                  Last refreshed:{" "}
                  {new Date(entry.last_metadata_refresh).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Description */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {entry.title}
            </h1>
            {/* personalRating not provided by backend; omitted */}
            {entry.description && (
              <p className="text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
            )}
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-2 gap-4">
            {entry.release_date && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar size={16} />
                  <span className="text-xs">Release Date</span>
                </div>
                <p className="font-semibold text-foreground">
                  {new Date(entry.release_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {entry.engine && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Zap size={16} />
                  <span className="text-xs">Engine</span>
                </div>
                <p className="font-semibold text-foreground">{entry.engine}</p>
              </div>
            )}
            {entry.version && (
              <div className="bg-card rounded-lg border border-border p-4">
                <span className="text-xs text-muted-foreground">Version</span>
                <p className="font-semibold text-foreground">{entry.version}</p>
              </div>
            )}
            {entry.storage_device && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FolderOpen size={16} />
                  <span className="text-xs">Storage</span>
                </div>
                <p className="font-semibold text-accent">
                  {entry.storage_device}
                </p>
              </div>
            )}
          </div>

          {/* Genres & Platforms */}
          <div className="space-y-4">
            {/* genres and platforms are frontend-only; omitted to match backend schema */}
          </div>

          {/* Developers & Publishers */}
          {(developers.length > 0 || publishers.length > 0) && (
            <div className="space-y-4">
              {developers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Developers
                  </h3>
                  <div className="space-y-2">
                    {developers.map((dev) => (
                      <Link
                        key={dev.id}
                        href={`/developers/${dev.id}`}
                        className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                      >
                        <p className="font-medium text-foreground">
                          {dev.name}
                        </p>
                        {/* country not provided by backend */}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {publishers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Publishers
                  </h3>
                  <div className="space-y-2">
                    {publishers.map((pub) => (
                      <Link
                        key={pub.id}
                        href={`/publishers/${pub.id}`}
                        className="block p-3 bg-card rounded-lg border border-border hover:border-accent transition-colors"
                      >
                        <p className="font-medium text-foreground">
                          {pub.name}
                        </p>
                        {/* country not provided by backend */}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Archive Information */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Archive Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Path:</span>
                <code className="text-accent font-mono text-xs">
                  {entry.file_path}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Archive Type:</span>
                <span className="font-medium text-foreground">
                  {entry.archive_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Verified:</span>
                <span className="font-medium text-foreground">
                  {entry.last_verified
                    ? new Date(entry.last_verified).toLocaleDateString()
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      <ScreenshotGallery entryId={entry.id} />

      {/* Metadata & Artwork Tools */}
      <Tabs defaultValue="metadata">
        <TabsList>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="artwork">Artwork</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="metadata" className="space-y-8">
          <MetadataComparison
            entry={entry}
            storedDevelopers={developers.map((dev) => dev.name)}
            storedPublishers={publishers.map((pub) => pub.name)}
          />
        </TabsContent>
        <TabsContent value="artwork" className="space-y-8">
          <ArtworkQualityIndicators
            entry={entry}
            screenshotCount={screenshots.length}
          />
          <div>
            <ArtworkComparisonDialog
              entry={entry}
              screenshots={screenshots}
            />
          </div>
          <ArtworkVersionHistory entry={entry} screenshots={screenshots} />
        </TabsContent>
        <TabsContent value="history" className="space-y-8">
          <MetadataAuditTrail entryId={entry.id} />
          <MetadataHistoryCard entryId={entry.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
