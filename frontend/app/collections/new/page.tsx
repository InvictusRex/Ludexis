"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collectionsApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
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

export default function NewCollectionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  useRequireAuth(user, authLoading);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const collection = await collectionsApi.create({
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      });
      toast.success("Collection created");
      router.push(`/collections/${collection.id}`);
    } catch (err) {
      console.error("Failed to create collection:", err);
      setError("Failed to create collection");
      toast.error("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-accent hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Create Collection</CardTitle>
          <CardDescription>
            Group related archive entries into a collection
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
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 mt-4"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Collection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
