'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { librariesApi, scansApi } from '@/lib/api'
import type { LibraryRead, ScanStatus } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAuth } from '@/hooks/use-protected-route'
import {
  ArrowLeft,
  Plus,
  Trash2,
  HardDrive,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminLibrary() {
  const { user, loading: authLoading } = useAuth()
  useRequireAuth(user, authLoading)

  const [libraries, setLibraries] = useState<LibraryRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const [creating, setCreating] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null)
  const [scanLoading, setScanLoading] = useState(true)
  const [runningFull, setRunningFull] = useState(false)
  const [runningIncremental, setRunningIncremental] = useState(false)

  const loadLibraries = useCallback(async () => {
    try {
      const data = await librariesApi.getAll()
      setLibraries(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load libraries:', err)
      setError('Failed to load libraries')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadScanStatus = useCallback(async () => {
    try {
      const status = await scansApi.getStatus()
      setScanStatus(status)
    } catch (err) {
      console.error('Failed to load scan status:', err)
    } finally {
      setScanLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadLibraries()
    loadScanStatus()
  }, [authLoading, user, loadLibraries, loadScanStatus])

  const handleCreate = async () => {
    if (!name.trim() || !path.trim()) return
    setCreating(true)
    try {
      await librariesApi.create({ name: name.trim(), path: path.trim() })
      setName('')
      setPath('')
      await loadLibraries()
    } catch (err) {
      console.error('Failed to create library:', err)
      setError('Failed to create library')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (lib: LibraryRead) => {
    setTogglingId(lib.id)
    try {
      await librariesApi.update(lib.id, { enabled: !lib.enabled })
      await loadLibraries()
    } catch (err) {
      console.error('Failed to update library:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (lib: LibraryRead) => {
    if (!window.confirm(`Delete library "${lib.name}"?`)) return
    setDeletingId(lib.id)
    try {
      await librariesApi.remove(lib.id)
      await loadLibraries()
    } catch (err) {
      console.error('Failed to delete library:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleRunFull = async () => {
    setRunningFull(true)
    try {
      await scansApi.runFull()
      await loadScanStatus()
    } catch (err) {
      console.error('Failed to run full scan:', err)
    } finally {
      setRunningFull(false)
    }
  }

  const handleRunIncremental = async () => {
    setRunningIncremental(true)
    try {
      await scansApi.runIncremental()
      await loadScanStatus()
    } catch (err) {
      console.error('Failed to run incremental scan:', err)
    } finally {
      setRunningIncremental(false)
    }
  }

  const scanCounts: { label: string; value: number; className: string }[] =
    scanStatus
      ? [
          { label: 'Pending', value: scanStatus.pending, className: 'text-yellow-500' },
          { label: 'Running', value: scanStatus.running, className: 'text-blue-500' },
          { label: 'Success', value: scanStatus.success, className: 'text-green-500' },
          { label: 'Failed', value: scanStatus.failed, className: 'text-red-500' },
          { label: 'Canceled', value: scanStatus.canceled, className: 'text-muted-foreground' },
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
        <h1 className="text-4xl font-bold text-foreground mb-2">Library Management</h1>
        <p className="text-muted-foreground">Configure archive storage locations and scanning</p>
      </div>

      {/* Libraries */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
          <CardDescription>Configure where your game archives are stored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading libraries...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : libraries.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No storage locations configured yet. Add one below.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libraries.map((lib) => (
                  <TableRow key={lib.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <HardDrive className="w-4 h-4 text-accent" />
                        </div>
                        <span className="font-medium text-foreground">{lib.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {lib.path}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={lib.enabled ? 'default' : 'secondary'}
                          className={lib.enabled ? 'bg-green-500/15 text-green-500 border-green-500/50' : ''}
                        >
                          {lib.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Switch
                          checked={lib.enabled}
                          disabled={togglingId === lib.id || deletingId === lib.id}
                          onCheckedChange={() => handleToggle(lib)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lib.created_at ? new Date(lib.created_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={togglingId === lib.id || deletingId === lib.id}
                        onClick={() => handleDelete(lib)}
                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                      >
                        {deletingId === lib.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Add Library */}
          <div className="border-t border-border pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lib-name">Name</Label>
                <Input
                  id="lib-name"
                  placeholder="External HDD 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lib-path">Path</Label>
                <Input
                  id="lib-path"
                  placeholder="/path/to/archive"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !path.trim()}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 mt-4"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scans */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Archive Scanning</CardTitle>
          <CardDescription>Run scans to discover and verify archives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {scanLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading scan status...
            </div>
          ) : scanStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
              Failed to load scan status.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleRunFull}
              disabled={runningFull || runningIncremental}
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto py-6 flex-col"
            >
              {runningFull ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              <div className="text-lg font-semibold mt-1">Run Full Scan</div>
              <div className="text-xs text-accent-foreground/70">Scan all locations</div>
            </Button>
            <Button
              onClick={handleRunIncremental}
              disabled={runningFull || runningIncremental}
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto py-6 flex-col"
            >
              {runningIncremental ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <div className="text-lg font-semibold mt-1">Incremental Scan</div>
              <div className="text-xs text-accent-foreground/70">Changes since last scan</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
