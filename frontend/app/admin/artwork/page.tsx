"use client";

import { useCallback, useEffect, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import { archiveApi, artworkApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAdmin } from "@/hooks/use-protected-route";
import type {
  ArchiveEntry,
  ArtworkMissingItem,
  ArtworkType,
} from "@/lib/types";
import {
  ArrowLeft,
  Download,
  Eye,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings2,
  Image as ImageIcon,
} from "lucide-react";
import { ArtworkManagementDialog } from "@/components/common/artwork-management-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastError, toastSuccess } from "@/lib/toast";

const TYPE_META: Record<ArtworkType, { label: string; className: string }> = {
  cover: {
    label: "Cover",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  banner: {
    label: "Banner",
    className: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  },
  logo: {
    label: "Logo",
    className: "bg-green-500/10 text-green-500 border-green-500/30",
  },
  screenshot: {
    label: "Screenshot",
    className: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  },
};

type UploadState = {
  artwork_type: ArtworkType | "";
  file: File | null;
  uploading: boolean;
  message: string | null;
  success: boolean;
  fileKey: number;
};

function defaultUploadState(artwork_type?: ArtworkType): UploadState {
  return {
    artwork_type: artwork_type ?? "",
    file: null,
    uploading: false,
    message: null,
    success: false,
    fileKey: 0,
  };
}

export default function AdminArtwork() {
  const [missing, setMissing] = useState<ArtworkMissingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<Record<string, UploadState>>({});
  const [autoDownloading, setAutoDownloading] = useState(false);
  const [autoDownloadMessage, setAutoDownloadMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ArchiveEntry | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    entryId: string;
    url: string;
  } | null>(null);

  const { user, loading: authLoading } = useAuth();

  useRequireAdmin(user, authLoading);

  const fetchMissing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await artworkApi.getMissing();
      setMissing(items);
    } catch (err) {
      console.error("Failed to load missing artwork:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load missing artwork",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    fetchMissing();
  }, [authLoading, user, fetchMissing]);

  function setUploadField(entryId: string, patch: Partial<UploadState>) {
    setUploads((prev) => {
      const existing = prev[entryId];
      const artwork_type =
        existing && existing.artwork_type
          ? existing.artwork_type
          : missing.find((m) => m.archive_entry_id === entryId)
              ?.missing_types?.[0];
      return {
        ...prev,
        [entryId]: {
          ...(existing ?? defaultUploadState(artwork_type)),
          ...patch,
        },
      };
    });
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, entryId: string) {
    e.preventDefault();
    setDragOverId(entryId);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverId(null);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, entryId: string) {
    e.preventDefault();
    setDragOverId(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadField(entryId, { file, message: null });
    }
  }

  function openPreview(entryId: string, file: File | null) {
    if (!file) {
      setPreview({ entryId, url: "" });
      return;
    }
    setPreview({ entryId, url: URL.createObjectURL(file) });
  }

  function closePreview() {
    setPreview((prev) => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  }

  async function handleUpload(entryId: string) {
    const state = uploads[entryId];
    if (!state || !state.file || !state.artwork_type || state.uploading) {
      return;
    }

    setUploadField(entryId, { uploading: true, message: null });

    try {
      await artworkApi.upload({
        archive_entry_id: entryId,
        artwork_type: state.artwork_type,
        file: state.file,
      });
      toastSuccess("Artwork uploaded");
      setUploadField(entryId, {
        uploading: false,
        file: null,
        fileKey: state.fileKey + 1,
        message: "Artwork uploaded successfully",
        success: true,
      });
      await fetchMissing();
    } catch (err) {
      console.error("Failed to upload artwork:", err);
      toastError(err, "Failed to upload artwork");
      setUploadField(entryId, {
        uploading: false,
        message:
          err instanceof Error ? err.message : "Failed to upload artwork",
        success: false,
      });
    }
  }

  async function handleManage(item: ArtworkMissingItem) {
    setManagingId(item.archive_entry_id);
    try {
      const entry = await archiveApi.getById(item.archive_entry_id);
      setSelected(entry);
    } catch (err) {
      console.error("Failed to load entry:", err);
      toastError(err, "Failed to load entry");
    } finally {
      setManagingId(null);
    }
  }

  async function handleAutoDownload() {
    setAutoDownloading(true);
    setAutoDownloadMessage(null);
    try {
      await artworkApi.autoDownload();
      setAutoDownloadMessage({
        success: true,
        text: "Auto-download completed. Refreshing missing artwork...",
      });
      await fetchMissing();
    } catch (err) {
      console.error("Failed to auto-download missing artwork:", err);
      setAutoDownloadMessage({
        success: false,
        text:
          err instanceof Error
            ? err.message
            : "Auto-download failed",
      });
    } finally {
      setAutoDownloading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-accent hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Artwork Management
        </h1>
        <p className="text-muted-foreground">
          Upload missing artwork for archive entries
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Missing Artwork</CardTitle>
            <CardDescription>
              Entries missing cover, banner, logo, or screenshot artwork
            </CardDescription>
          </div>
          <Button
            onClick={handleAutoDownload}
            disabled={autoDownloading || loading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
          >
            {autoDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Auto-download Missing Artwork
          </Button>
        </CardHeader>
        <CardContent>
          {autoDownloadMessage && (
            <div
              className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-md text-sm ${
                autoDownloadMessage.success
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {autoDownloadMessage.success ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {autoDownloadMessage.text}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading missing artwork...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMissing}
                className="border-border gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </div>
          ) : missing.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <p className="text-sm">
                All artwork is present — nothing missing
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Missing Types</TableHead>
                  <TableHead className="whitespace-normal">Upload Artwork</TableHead>
                  <TableHead>Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missing.map((item) => {
                  const upload = uploads[item.archive_entry_id] ?? {
                    ...defaultUploadState(item.missing_types[0]),
                  };
                  return (
                    <TableRow key={item.archive_entry_id}>
                      <TableCell className="whitespace-normal font-medium text-foreground">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {item.missing_types.map((type) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className={TYPE_META[type].className}
                            >
                              {TYPE_META[type].label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal min-w-[320px]">
                        <div
                          onDragOver={(e) =>
                            handleDragOver(e, item.archive_entry_id)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) =>
                            handleDrop(e, item.archive_entry_id)
                          }
                          className={`space-y-2 rounded-md border border-dashed p-2 transition-colors ${
                            dragOverId === item.archive_entry_id
                              ? "border-accent bg-accent/10"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Label
                                htmlFor={`type-${item.archive_entry_id}`}
                                className="sr-only"
                              >
                                Artwork type
                              </Label>
                              <Select
                                value={upload.artwork_type}
                                onValueChange={(value) =>
                                  setUploadField(item.archive_entry_id, {
                                    artwork_type: value as ArtworkType,
                                    message: null,
                                  })
                                }
                              >
                                <SelectTrigger
                                  id={`type-${item.archive_entry_id}`}
                                  className="w-36"
                                >
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.missing_types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {TYPE_META[type].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                key={`file-${item.archive_entry_id}-${upload.fileKey}`}
                                id={`file-${item.archive_entry_id}`}
                                type="file"
                                accept="image/*"
                                className="w-56"
                                disabled={upload.uploading}
                                onChange={(e) =>
                                  setUploadField(item.archive_entry_id, {
                                    file: e.target.files?.[0] ?? null,
                                    message: null,
                                  })
                                }
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 border-border"
                              disabled={upload.uploading}
                              onClick={() =>
                                openPreview(
                                  item.archive_entry_id,
                                  upload.file,
                                )
                              }
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                              disabled={
                                !upload.file ||
                                !upload.artwork_type ||
                                upload.uploading
                              }
                              onClick={() =>
                                handleUpload(item.archive_entry_id)
                              }
                            >
                              {upload.uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {upload.uploading ? "Uploading..." : "Upload"}
                            </Button>
                          </div>
                          {upload.message && (
                            <p
                              className={`flex items-center gap-1.5 text-sm ${
                                upload.success
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {upload.success ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                              {upload.message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-border"
                          disabled={managingId !== null}
                          onClick={() => handleManage(item)}
                        >
                          {managingId === item.archive_entry_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Settings2 className="w-4 h-4" />
                          )}
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            closePreview();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {missing.find(
                (m) => m.archive_entry_id === preview?.entryId,
              )?.title ?? "Artwork Preview"}
            </DialogTitle>
            <DialogDescription>
              {preview?.url
                ? "Preview of the selected artwork file"
                : "No file selected yet. Choose a file or drag & drop an image onto the row to preview it."}
            </DialogDescription>
          </DialogHeader>
          {preview?.url ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt="Artwork preview"
                className="max-h-[50vh] w-auto rounded-md border object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <ImageIcon className="w-10 h-10" />
              <p className="text-sm">No file selected for this entry.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selected && (
        <ArtworkManagementDialog
          entry={selected}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelected(null);
            }
          }}
        />
      )}
    </div>
  );
}
