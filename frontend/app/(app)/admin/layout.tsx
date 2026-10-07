"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { canSeeDashboard } from "@/lib/permissions";
import { Page, PageHeader } from "@/components/shell/page";
import { SectionNav } from "@/components/admin/section-nav";
import { visibleSections } from "@/components/admin/sections";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = canSeeDashboard(user);

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/");
    }
  }, [allowed, loading, router, user]);

  if (!allowed) {
    return null;
  }

  return (
    <Page>
      <PageHeader title="Admin Dashboard" className="mb-6" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10">
        <SectionNav sections={visibleSections(user)} />
        {/* Sections read their tab from the URL, which needs a Suspense boundary. */}
        <div className="min-w-0">
          <Suspense>{children}</Suspense>
        </div>
      </div>
    </Page>
  );
}
