"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function AdminJobs() {
  const jobs = [
    {
      id: "1",
      name: "Full Archive Scan",
      status: "completed",
      progress: 100,
      startTime: "2 hours ago",
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      id: "2",
      name: "Metadata Refresh",
      status: "running",
      progress: 67,
      startTime: "30 minutes ago",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      id: "3",
      name: "Integrity Verification",
      status: "queued",
      progress: 0,
      startTime: "In queue",
      icon: AlertCircle,
      color: "text-gray-500",
    },
  ];

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
        <h1 className="text-4xl font-bold text-foreground mb-2">Job Center</h1>
        <p className="text-muted-foreground">
          Monitor and manage background jobs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {["Queue", "Running", "Completed"].map((status) => (
          <Card key={status} className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">{status}</CardTitle>
              <CardDescription>
                {
                  jobs.filter((j) => j.status.includes(status.toLowerCase()))
                    .length
                }{" "}
                jobs
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {jobs.map((job) => {
          const IconComponent = job.icon;
          return (
            <Card key={job.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <IconComponent className={`w-6 h-6 ${job.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {job.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {job.startTime}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {job.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                  {job.status === "running" && (
                    <Button size="sm" variant="outline">
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  {job.status === "queued" && (
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
