'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  healthApi,
  jobMonitorApi,
  librariesApi,
  scansApi,
} from '@/lib/api'
import type {
  HealthStatus,
  JobMonitorStats,
  JobMonitorWorker,
  LibraryRead,
  ScanStatus,
} from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAdmin } from '@/hooks/use-protected-route'
import {
  ArrowLeft,
  Loader2,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Settings2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const HEALTHY_VALUES = new Set(['healthy', 'ok', 'pong'])

function isHealthy(value: string | undefined): boolean {
  return typeof value === 'string' && HEALTHY_VALUES.has(value.toLowerCase())
}

function HealthBadge({ value }: { value: string | undefined }) {
  const healthy = isHealthy(value)
  return (
    <Badge
      variant={healthy ? 'default' : 'destructive'}
      className={
        healthy ? 'bg-green-500/15 text-green-500 border-green-500/50' : ''
      }
    >
      {healthy ? 'Healthy' : 'Unavailable'}
    </Badge>
  )
}

export default function AdminSettings() {
  const { user, loading: authLoading } = useAuth()
  useRequireAdmin(user, authLoading)

  const [loading, setLoading] = useState(true)

  const [apiHealth, setApiHealth] = useState<HealthStatus | null>(null)
  const [dbHealth, setDbHealth] = useState<HealthStatus | null>(null)
  const [redisHealth, setRedisHealth] = useState<HealthStatus | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  const [stats, setStats] = useState<JobMonitorStats | null>(null)
  const [workers, setWorkers] = useState<JobMonitorWorker | null>(null)
  const [workersError, setWorkersError] = useState<string | null>(null)

  const [libraries, setLibraries] = useState<LibraryRead[]>([])
  const [librariesError, setLibrariesError] = useState<string | null>(null)

  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    let cancelled = false

    const safeFetch = async <T,>(promise: Promise<T>): Promise<T | null> => {
      try {
        return await promise
      } catch (err) {
        console.error('Health check failed:', err)
        return null
      }
    }

    const load = async () => {
      const [api, db, redis] = await Promise.all([
        safeFetch(healthApi.getHealth()),
        safeFetch(healthApi.getDb()),
        safeFetch(healthApi.getRedis()),
      ])

      try {
        const [s, w] = await Promise.all([
          jobMonitorApi.getStats(),
          jobMonitorApi.getWorkers(),
        ])
        if (!cancelled) {
          setStats(s)
          setWorkers(w)
        }
      } catch (err) {
        console.error('Failed to load workers:', err)
        if (!cancelled) setWorkersError('Failed to load workers')
      }

      try {
        const data = await librariesApi.getAll()
        if (!cancelled) setLibraries(data)
      } catch (err) {
        console.error('Failed to load storage locations:', err)
        if (!cancelled) setLibrariesError('Failed to load storage locations')
      }

      try {
        const status = await scansApi.getStatus()
        if (!cancelled) setScanStatus(status)
      } catch (err) {
        console.error('Failed to load scan summary:', err)
        if (!cancelled) setScanError('Failed to load scan summary')
      }

      if (!cancelled) {
        if (api === null && db === null && redis === null) {
          setHealthError('Failed to load system health')
        } else {
          setHealthError(null)
        }
        setApiHealth(api)
        setDbHealth(db)
        setRedisHealth(redis)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  const scanCounts: { label: string; value: number; className: string }[] =
    scanStatus
      ? [
          { label: 'Pending', value: scanStatus.pending, className: 'text-yellow-500' },
          { label: 'Running', value: scanStatus.running, className: 'text-blue-500' },
          { label: 'Success', value: scanStatus.success, className: 'text-green-500' },
          { label: 'Failed', value: scanStatus.failed, className: 'text-red-500' },
          { label: 'Canceled', value: scanStatus.canceled, className: 'text-muted-foreground' },
          { label: 'Total', value: scanStatus.total, className: 'text-foreground' },
        ]
      : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">System Settings</h1>
        <p className="text-muted-foreground">Operational status and system information</p>
      </div>

      {/* System Health */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-accent" />
            System Health
          </CardTitle>
          <CardDescription>Live status of the API, database, and Redis</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading system health...
            </div>
          ) : healthError ? (
            <div className="py-8 text-center text-red-500">{healthError}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-foreground">API</TableCell>
                  <TableCell>
                    <HealthBadge value={apiHealth?.status} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {apiHealth?.status ?? '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Database</TableCell>
                  <TableCell>
                    <HealthBadge value={dbHealth?.database} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {dbHealth?.database ?? '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-foreground">Redis</TableCell>
                  <TableCell>
                    <HealthBadge value={redisHealth?.redis} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {redisHealth?.redis ?? '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Workers */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" />
            Workers
          </CardTitle>
          <CardDescription>Connected Celery workers and job queue statistics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading workers...
            </div>
          ) : workersError ? (
            <div className="py-8 text-center text-red-500">{workersError}</div>
          ) : (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-card rounded-lg border border-border text-center">
                    <p className="text-3xl font-bold text-foreground">{stats.workers}</p>
                    <p className="text-xs text-muted-foreground mt-1">Workers</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border border-border text-center">
                    <p className="text-3xl font-bold text-foreground">{stats.active_tasks}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active Tasks</p>
                  </div>
                  <div className="p-4 bg-card rounded-lg border border-border text-center">
                    <p className="text-3xl font-bold text-foreground">{stats.reserved_tasks}</p>
                    <p className="text-xs text-muted-foreground mt-1">Reserved Tasks</p>
                  </div>
                </div>
              )}
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Connected Workers</h3>
                {workers && Object.keys(workers).length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No workers connected.
                  </div>
                ) : workers ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(workers).map(([name, info]) => (
                        <TableRow key={name}>
                          <TableCell className="font-mono text-sm text-foreground">{name}</TableCell>
                          <TableCell>
                            <HealthBadge value={info.ok} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    Failed to load workers.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Storage Locations */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-accent" />
            Storage Locations
          </CardTitle>
          <CardDescription>Configured archive storage locations (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading storage locations...
            </div>
          ) : librariesError ? (
            <div className="py-8 text-center text-red-500">{librariesError}</div>
          ) : libraries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No storage locations configured.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map((lib) => (
                  <TableRow key={lib.id}>
                    <TableCell className="font-medium text-foreground">{lib.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {lib.path}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={lib.enabled ? 'default' : 'secondary'}
                        className={lib.enabled ? 'bg-green-500/15 text-green-500 border-green-500/50' : ''}
                      >
                        {lib.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Scan Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Scan Summary
          </CardTitle>
          <CardDescription>Aggregated scan job status counts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading scan summary...
            </div>
          ) : scanError ? (
            <div className="py-8 text-center text-red-500">{scanError}</div>
          ) : scanStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
              {scanCounts.map((count) => (
                <div
                  key={count.label}
                  className="p-4 bg-card rounded-lg border border-border text-center"
                >
                  <p className={`text-3xl font-bold ${count.className}`}>{count.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{count.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Failed to load scan summary.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-accent" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            These settings are managed via environment configuration and are not exposed by the
            API. They cannot be changed from this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Archive Name</Label>
            <Input
              value="Managed via environment configuration — not exposed by the API"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value="Managed via environment configuration — not exposed by the API"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Appearance</Label>
            <Input
              value="Managed via environment configuration — not exposed by the API"
              disabled
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
