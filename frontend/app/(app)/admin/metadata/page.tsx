"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRequirePermission } from "@/hooks/use-protected-route";
import { can } from "@/lib/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader, useTabParam } from "@/components/admin/common";
import { DuplicatesPanel } from "@/components/admin/duplicates-panel";
import { MissingArtwork } from "@/components/admin/missing-artwork";
import { ReviewQueue } from "@/components/admin/review-queue";

const TABS = ["review", "artwork", "duplicates"] as const;

export default function DashboardMetadata() {
  const { user, loading } = useAuth();
  useRequirePermission(user, loading, "EDIT_METADATA");
  const [tab, setTab] = useTabParam(TABS, "review");

  if (!can(user, "EDIT_METADATA")) {
    return null;
  }

  return (
    <div>
      <SectionHeader
        title="Metadata"
        description="Games that need a hand: ones a scan could not identify, missing artwork and files stored twice."
      />
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList>
          <TabsTrigger value="review">Review queue</TabsTrigger>
          <TabsTrigger value="artwork">Missing artwork</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>
        <TabsContent value="review">
          <ReviewQueue />
        </TabsContent>
        <TabsContent value="artwork">
          <MissingArtwork />
        </TabsContent>
        <TabsContent value="duplicates">
          <DuplicatesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
