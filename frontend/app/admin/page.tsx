"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, jobsApi, scansApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-protected-route";
import { AdminStats, JobHistory, JobStatus } from "@/lib/types";
import {
  BarChart3,
  Database,
  Zap,
  AlertCircle,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const JOB_TYPE_LABELS: Record<JobHistory["job_type"], string> = {
  LIBRARY_SCAN: "Full Scan",
  INCREMENTAL_SCAN: "Incremental Scan",
  METADATA_REFRESH: "Metadata Refresh",
  ARTWORK_REFRESH: "Artwork Refresh",
  DUPLICATE_DETECTION: "Duplicate Detection",
  INTEGRITY_VERIFICATION: "Integrity Verification",
};

const STATUS_STYLES: Record<JobStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  RUNNING: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SUCCESS: "bg-green-500/15 text-green-600 border-green-500/30",
  FAILED: "bg-red-500/15 text-red-600 border-red-500/30",
  CANCELED: "bg-gray-500/15 text-gray-600 border-gray-500/30",
};

function humanizeJobType(jobType: JobHistory["job_type"]): string {
  return JOB_TYPE_LABELS[jobType] ?? jobType.replace(/_/g, " ").toLowerCase();
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [jobs, setJobs] = useState<JobHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

  useRequireAuth(user, authLoading);

  const loadJobs = useCallback(async () => {
    const recentJobs = await adminApi.getRecentJobs();
    setJobs(recentJobs);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsData, jobsData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRecentJobs(),
      ]);
      setStats(statsData);
      setJobs(jobsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      setError("Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [authLoading, loadData]);

  const runAction = useCallback(
    async (action: string, fn: () => Promise<unknown>) => {
      setBusyAction(action);
      setError(null);
      try {
        await fn();
        await loadJobs();
      } catch (error) {
        console.error(`Failed to run ${action}:`, error);
        setError(`Failed to run ${action}.`);
      } finally {
        setBusyAction(null);
      }
    },
    [loadJobs],
  );

  const adminSections = [
    {
      title: "Library Management",
      description: "Configure storage locations and run archive scans",
      href: "/admin/library",
      icon: Database,
      color: "bg-blue-500/10",
      accentColor: "text-blue-500",
    },
    {
      title: "Job Center",
      description: "Monitor and manage background jobs and scans",
      href: "/admin/jobs",
      icon: Zap,
      color: "bg-yellow-500/10",
      accentColor: "text-yellow-500",
    },
    {
      title: "Metadata Review",
      description: "Review and correct unmatched archive entries",
      href: "/admin/metadata",
      icon: AlertCircle,
      color: "bg-orange-500/10",
      accentColor: "text-orange-500",
    },
    {
      title: "Artwork Management",
      description: "Replace and manage entry artwork",
      href: "/admin/artwork",
      icon: RotateCw,
      color: "bg-purple-500/10",
      accentColor: "text-purple-500",
    },
    {
      title: "Collections",
      description: "Create and manage user collections",
      href: "/admin/collections",
      icon: BarChart3,
      color: "bg-green-500/10",
      accentColor: "text-green-500",
    },
    {
      title: "User Management",
      description: "Create and manage user accounts and roles",
      href: "/admin/users",
      icon: AlertTriangle,
      color: "bg-red-500/10",
      accentColor: "text-red-500",
    },
    {
      title: "Permissions",
      description: "Configure roles and access control",
      href: "/admin/permissions",
      icon: Clock,
      color: "bg-indigo-500/10",
      accentColor: "text-indigo-500",
    },
    {
      title: "System Settings",
      description: "Configure system settings and appearance",
      href: "/admin/settings",
      icon: CheckCircle2,
      color: "bg-teal-500/10",
      accentColor: "text-teal-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Administration Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your Ludexis archive platform
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading dashboard...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-md p-3 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Total Entries</p>
            <p className="text-3xl font-bold text-accent">
              {stats?.archive_entries ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Collections</p>
            <p className="text-3xl font-bold text-accent">
              {stats?.collections ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Users</p>
            <p className="text-3xl font-bold text-accent">
              {stats?.users ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">
              Metadata Coverage
            </p>
            <p className="text-3xl font-bold text-green-500">
              {stats ? `${Math.round(stats.metadata_coverage)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">
              Verification Coverage
            </p>
            <p className="text-3xl font-bold text-blue-500">
              {stats ? `${Math.round(stats.verification_coverage)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Run common administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading || busyAction !== null}
              onClick={() =>
                runAction("fullScan", () => scansApi.runFull())
              }
            >
              {busyAction === "fullScan" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Run Full Scan
            </Button>
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={loading || busyAction !== null}
              onClick={() =>
                runAction("metadataRefresh", () =>
                  jobsApi.start("METADATA_REFRESH"),
                )
              }
            >
              {busyAction === "metadataRefresh" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Metadata
            </Button>
            <Button
              variant="outline"
              className="border-border"
              disabled={loading || busyAction !== null}
              onClick={() =>
                runAction("verifyArchives", () =>
                  jobsApi.start("INTEGRITY_VERIFICATION"),
                )
              }
            >
              {busyAction === "verifyArchives" && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Verify Archives
            </Button>
            <Link href="/admin/metadata">
              <Button
                variant="outline"
                className="border-border w-full"
                disabled={busyAction !== null}
              >
                Review Unmatched
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
          <CardDescription>
            Latest background tasks and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent jobs found.</p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const status: JobStatus = job.status ?? "PENDING";
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {humanizeJobType(job.job_type)}
                        </p>
                        <Badge className={STATUS_STYLES[status]}>
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.started_at
                          ? `Started ${new Date(job.started_at).toLocaleString()}`
                          : "Not started"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">
                            {job.progress ?? 0}%
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              status === "SUCCESS"
                                ? "text-green-500"
                                : status === "FAILED"
                                  ? "text-red-500"
                                  : status === "RUNNING"
                                    ? "text-blue-500"
                                    : "text-accent"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{ width: `${job.progress ?? 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/admin/jobs" className="inline-block mt-4">
            <Button variant="outline" size="sm" className="border-border">
              View All Jobs →
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Admin Sections Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Administration Sections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminSections.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="h-full border-border hover:border-accent transition-colors cursor-pointer group">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${section.accentColor}`}
                      />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Link */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Audit & Logs
            <Link href="/admin/audit-logs">
              <Button variant="outline" size="sm" className="border-border">
                View Logs →
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>
            View system activity and audit trail
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
