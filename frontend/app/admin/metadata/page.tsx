"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { archiveApi, metadataApi } from "@/lib/api";
import type { ArchiveEntry, MetadataSearchResult } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ProviderSourceBadge } from "@/components/common/provider-source-badge";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Save,
  FileText,
} from "lucide-react";

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

interface EditForm {
  title: string;
  description: string;
  release_date: string;
}

export default function AdminMetadata() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [conflicts, setConflicts] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [form, setForm] = useState<EditForm>({
    title: "",
    description: "",
    release_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MetadataSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [unmatched, partial] = await Promise.all([
        archiveApi.search("", { metadataStatus: ["UNMATCHED"] }),
        archiveApi.search("", { metadataStatus: ["PARTIAL"] }),
      ]);
      setEntries(unmatched);
      setConflicts(partial);
    } catch (err) {
      console.error("Failed to load unmatched entries:", err);
      setError("Failed to load unmatched entries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      return;
    }
    loadEntries();
  }, [authLoading, user, loadEntries]);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  const handleSelect = (entry: ArchiveEntry) => {
    setSelectedId(entry.id);
    setForm({
      title: entry.title ?? "",
      description: entry.description ?? "",
      release_date: entry.release_date ?? "",
    });
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedId) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await archiveApi.updateMetadata(selectedId, {
        title: form.title,
        description: form.description,
        release_date: form.release_date,
        metadata_override: true,
      });
      setSaveSuccess(true);
      await loadEntries();
    } catch (err) {
      console.error("Failed to update metadata:", err);
      setSaveError("Failed to save metadata");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const results = await metadataApi.search(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      console.error("Failed to search metadata provider:", err);
      setSearchError("Failed to search metadata provider");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const applyResult = (result: MetadataSearchResult) => {
    setForm((prev) => ({
      ...prev,
      title: result.title || prev.title,
      description: result.summary ?? prev.description,
      release_date: result.release_date ?? prev.release_date,
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-8">
        <div className="h-48 bg-card rounded-lg animate-pulse" />
        <div className="h-96 bg-card rounded-lg animate-pulse" />
      </div>
    );
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
          Metadata Review
        </h1>
        <p className="text-muted-foreground">
          Review and correct unmatched archive entries
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unmatched entries list */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Unmatched Entries</CardTitle>
            <CardDescription>
              {entries.length} entries without metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No unmatched entries
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleSelect(entry)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedId === entry.id
                        ? "border-accent bg-accent/10"
                        : "border-border bg-card hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {entry.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {entry.file_path}
                        </p>
                      </div>
                      <Badge
                        className={getMetadataStatusColor(
                          entry.metadata_status,
                        )}
                      >
                        {entry.metadata_status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Edit Metadata
              </CardTitle>
              <CardDescription>
                {selectedEntry
                  ? selectedEntry.file_path
                  : "Select an unmatched entry to edit"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedEntry ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  Select an entry from the list to edit its metadata
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="release_date">Release Date</Label>
                    <Input
                      id="release_date"
                      type="date"
                      value={form.release_date}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          release_date: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {saveError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{saveError}</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-green-500/50 bg-green-500/10 text-green-500 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Metadata saved successfully</span>
                    </div>
                  )}

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Metadata
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata provider search */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Metadata Provider
              </CardTitle>
              <CardDescription>
                Search for a game and apply its metadata to the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </Button>
              </div>

              {searchError && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{searchError}</span>
                </div>
              )}

              {searchResults.length === 0 && !searching ? (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No results yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.provider}-${result.provider_id}`}
                      onClick={() => applyResult(result)}
                      className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {result.title}
                          </p>
                          {result.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {result.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {result.release_date && (
                              <span className="text-xs text-muted-foreground">
                                {result.release_date}
                              </span>
                            )}
                            {typeof result.score === "number" && (
                              <Badge variant="outline">
                                {Math.round(result.score * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {result.provider}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metadata Conflicts */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Metadata Conflicts</CardTitle>
          <CardDescription>
            {conflicts.length} entries with partial metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conflicts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No metadata conflicts
            </p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {conflicts.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/archive/${entry.id}`}
                  className="block p-4 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {entry.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        Review: view entry details
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ProviderSourceBadge
                        source={entry.metadata_source}
                        sourceCode={entry.metadata_source_code}
                      />
                      {entry.metadata_confidence != null && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(entry.metadata_confidence * 100)}%
                        </span>
                      )}
                      <Badge
                        className={getMetadataStatusColor(
                          entry.metadata_status,
                        )}
                      >
                        {entry.metadata_status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
