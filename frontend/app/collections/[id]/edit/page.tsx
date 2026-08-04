"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { collectionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EditCollectionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(user, authLoading);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const loadCollection = async () => {
      if (!user) {
        return;
      }

      try {
        const collection = await collectionsApi.getById(id);
        setName(collection.name);
        setDescription(collection.description ?? "");
        setVisibility(
          collection.visibility === "private" ? "private" : "public",
        );
      } catch (err) {
        console.error("Failed to load collection:", err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    loadCollection();
  }, [id, authLoading, user]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await collectionsApi.update(id, {
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      });
      toast.success("Collection updated");
      router.push(`/collections/${id}`);
    } catch (err) {
      console.error("Failed to update collection:", err);
      setError("Failed to update collection");
      toast.error("Failed to update collection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-40 bg-card rounded-lg animate-pulse" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Collection not found</p>
        <Link href="/collections">
          <Button variant="outline">Back to Collections</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/collections/${id}`}
        className="inline-flex items-center gap-2 text-accent hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collection
      </Link>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Edit Collection</CardTitle>
          <CardDescription>
            Update collection name, description, or visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="col-name">Name</Label>
              <Input
                id="col-name"
                placeholder="Retro Classics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-description">Description</Label>
              <Input
                id="col-description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as "public" | "private")}
              >
                <SelectTrigger id="col-visibility" className="w-full">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
          <Button
            onClick={handleUpdate}
            disabled={saving || !name.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 mt-4"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
