'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import type { AuditLogRead } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAuth } from '@/hooks/use-protected-route'
import {
  ArrowLeft,
  Loader2,
  ScrollText,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DETAILS_MAX_LENGTH = 80

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function actionBadgeClass(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes('delete')) return 'bg-red-500/15 text-red-500 border-red-500/50'
  if (lower.includes('create')) return 'bg-green-500/15 text-green-500 border-green-500/50'
  if (lower.includes('update') || lower.includes('edit')) return 'bg-blue-500/15 text-blue-500 border-blue-500/50'
  if (lower.includes('upload')) return 'bg-purple-500/15 text-purple-500 border-purple-500/50'
  return 'bg-accent/20 text-accent border-accent/50'
}

function truncateDetails(details: string): string {
  return details.length > DETAILS_MAX_LENGTH
    ? `${details.slice(0, DETAILS_MAX_LENGTH)}…`
    : details
}

export default function AdminAuditLogs() {
  const { user, loading: authLoading } = useAuth()
  useRequireAuth(user, authLoading)

  const [logs, setLogs] = useState<AuditLogRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({ user_id: '', action: '', entity: '' })

  const loadLogs = useCallback(async () => {
    try {
      const query = {
        user_id: filters.user_id.trim() || undefined,
        action: filters.action.trim() || undefined,
        entity: filters.entity.trim() || undefined,
      }
      const data = await adminApi.getAuditLogs(query)
      setLogs(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [filters.user_id, filters.action, filters.entity])

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    setLoading(true)
    const timer = setTimeout(() => {
      loadLogs()
    }, 300)

    return () => clearTimeout(timer)
  }, [authLoading, user, loadLogs])

  const handleFilterChange = (field: keyof typeof filters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">View system activity and changes</p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter audit logs by user, action, or entity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="filter-user">User ID</Label>
              <Input
                id="filter-user"
                placeholder="Filter by user"
                value={filters.user_id}
                onChange={handleFilterChange('user_id')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-action">Action</Label>
              <Input
                id="filter-action"
                placeholder="e.g. create, update, delete"
                value={filters.action}
                onChange={handleFilterChange('action')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-entity">Entity</Label>
              <Input
                id="filter-entity"
                placeholder="e.g. archive, collection"
                value={filters.entity}
                onChange={handleFilterChange('entity')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Recent actions recorded across the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading audit logs...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500 flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No audit logs found{Object.values(filters).some((v) => v.trim()) ? ' for the current filters' : ''}.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionBadgeClass(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{log.entity}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.entity_id ?? '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {log.user_id ?? 'system'}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[320px]">
                      {log.details ? (
                        <span
                          className="block truncate"
                          title={log.details}
                        >
                          {truncateDetails(log.details)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
