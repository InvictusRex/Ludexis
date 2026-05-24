'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi, archiveApi } from '@/lib/api'
import { LibraryJob, ArchiveEntry } from '@/lib/types'
import {
  BarChart3,
  Database,
  Zap,
  AlertCircle,
  HardDrive,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEntries: 0,
    unmatchedEntries: 0,
    totalStorage: '1.2 TB',
    metadataCoverage: 0,
  })
  const [jobs, setJobs] = useState<LibraryJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const entries = await archiveApi.getAll()
        const unmatchedCount = entries.filter((e) => e.metadataStatus === 'UNMATCHED').length
        const matchedCount = entries.filter((e) => e.metadataStatus === 'MATCHED').length
        const coverage = entries.length > 0 ? Math.round((matchedCount / entries.length) * 100) : 0

        setStats({
          totalEntries: entries.length,
          unmatchedEntries: unmatchedCount,
          totalStorage: '1.2 TB',
          metadataCoverage: coverage,
        })

        // Simulate recent jobs
        const recentJobs: LibraryJob[] = [
          {
            id: '1',
            type: 'FullScan',
            status: 'completed',
            progress: 100,
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(Date.now() - 1800000),
          },
          {
            id: '2',
            type: 'MetadataRefresh',
            status: 'running',
            progress: 45,
            startTime: new Date(Date.now() - 600000),
            endTime: null,
          },
        ]
        setJobs(recentJobs)
      } catch (error) {
        console.error('Failed to load admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const adminSections = [
    {
      title: 'Library Management',
      description: 'Configure storage locations and run archive scans',
      href: '/admin/library',
      icon: Database,
      color: 'bg-blue-500/10',
      accentColor: 'text-blue-500',
    },
    {
      title: 'Job Center',
      description: 'Monitor and manage background jobs and scans',
      href: '/admin/jobs',
      icon: Zap,
      color: 'bg-yellow-500/10',
      accentColor: 'text-yellow-500',
    },
    {
      title: 'Metadata Review',
      description: 'Review and correct unmatched archive entries',
      href: '/admin/metadata',
      icon: AlertCircle,
      color: 'bg-orange-500/10',
      accentColor: 'text-orange-500',
    },
    {
      title: 'Artwork Management',
      description: 'Replace and manage entry artwork',
      href: '/admin/artwork',
      icon: RotateCw,
      color: 'bg-purple-500/10',
      accentColor: 'text-purple-500',
    },
    {
      title: 'Collections',
      description: 'Create and manage user collections',
      href: '/admin/collections',
      icon: BarChart3,
      color: 'bg-green-500/10',
      accentColor: 'text-green-500',
    },
    {
      title: 'User Management',
      description: 'Create and manage user accounts and roles',
      href: '/admin/users',
      icon: AlertTriangle,
      color: 'bg-red-500/10',
      accentColor: 'text-red-500',
    },
    {
      title: 'Permissions',
      description: 'Configure roles and access control',
      href: '/admin/permissions',
      icon: Clock,
      color: 'bg-indigo-500/10',
      accentColor: 'text-indigo-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system settings and appearance',
      href: '/admin/settings',
      icon: CheckCircle2,
      color: 'bg-teal-500/10',
      accentColor: 'text-teal-500',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Administration Dashboard</h1>
        <p className="text-muted-foreground">Manage your Ludexis archive platform</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Total Entries</p>
            <p className="text-3xl font-bold text-accent">{stats.totalEntries}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Unmatched Entries</p>
            <p className="text-3xl font-bold text-orange-500">{stats.unmatchedEntries}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Metadata Coverage</p>
            <p className="text-3xl font-bold text-green-500">{stats.metadataCoverage}%</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-2">Total Storage</p>
            <p className="text-3xl font-bold text-blue-500">{stats.totalStorage}</p>
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
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Run Full Scan
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              Refresh Metadata
            </Button>
            <Button variant="outline" className="border-border">
              Verify Archives
            </Button>
            <Link href="/admin/metadata">
              <Button variant="outline" className="border-border w-full">
                Review Unmatched
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      {jobs.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest background tasks and operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{job.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.status === 'completed'
                        ? `Completed ${Math.round((Date.now() - job.startTime.getTime()) / 60000)} minutes ago`
                        : `Running for ${Math.round((Date.now() - job.startTime.getTime()) / 60000)} minutes`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">{job.progress}%</span>
                        <span
                          className={`text-xs font-medium ${
                            job.status === 'completed' ? 'text-green-500' : 'text-accent'
                          }`}
                        >
                          {job.status === 'completed' ? 'Completed' : 'Running'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/jobs" className="inline-block mt-4">
              <Button variant="outline" size="sm" className="border-border">
                View All Jobs →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Admin Sections Grid */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Administration Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminSections.map((section) => {
            const IconComponent = section.icon
            return (
              <Link key={section.href} href={section.href}>
                <Card className="h-full border-border hover:border-accent transition-colors cursor-pointer group">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent className={`w-6 h-6 ${section.accentColor}`} />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
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
          <CardDescription>View system activity and audit trail</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
