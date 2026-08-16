'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { archiveApi } from '@/lib/api'
import type { DuplicateGroup } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAdmin } from '@/hooks/use-protected-route'
import { toastError, toastSuccess } from '@/lib/toast'
import { ArrowLeft, Copy, FileSearch, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DuplicateGroupCard } from '@/components/common/duplicate-group-card'

export default function AdminDuplicates() {
  const { user, loading: authLoading } = useAuth()
  useRequireAdmin(user, authLoading)

  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDuplicates = useCallback(async () => {
    setLoading(true)
    try {
      const data = await archiveApi.getDuplicates()
      setGroups(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load duplicate groups:', err)
      setError('Failed to load duplicate groups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadDuplicates()
  }, [authLoading, user, loadDuplicates])

  const emphasized = groups.filter((g) => g.count > 2)
  const normal = groups.filter((g) => g.count <= 2)

  const handleDeleteEntry = async (id: string) => {
    try {
      await archiveApi.delete(id)
      toastSuccess('Archive entry deleted')
      await loadDuplicates()
    } catch (err) {
      toastError(err, 'Failed to delete archive entry')
    }
  }

  const handleResolve = async (keepId: string, duplicateIds: string[]) => {
    const results = await Promise.allSettled(
      duplicateIds.map((id) => archiveApi.delete(id)),
    )
    const failed = results.filter((result) => result.status === 'rejected').length
    const deleted = results.length - failed
    if (failed === 0) {
      toastSuccess(
        `Deleted ${deleted} duplicate${deleted !== 1 ? 's' : ''} and kept 1`,
      )
    } else if (deleted === 0) {
      toastError(new Error('All deletions failed'), 'Failed to resolve duplicate group')
    } else {
      toastError(
        new Error('Some deletions failed'),
        `Deleted ${deleted} of ${results.length} duplicates`,
      )
    }
    await loadDuplicates()
  }

  const renderGroup = (group: DuplicateGroup) => (
    <DuplicateGroupCard
      key={group.file_hash}
      group={group}
      onDeleteEntry={handleDeleteEntry}
      onResolve={handleResolve}
    />
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-accent hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Duplicate Detection
            </h1>
            <p className="text-muted-foreground">
              Files that share the same content hash across the archive
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadDuplicates}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Link href="/admin/jobs">
                <FileSearch className="w-4 h-4" />
                Run DUPLICATE_DETECTION scan
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading duplicate groups...
        </div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" onClick={loadDuplicates} className="mt-4 gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Copy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground mb-1">No duplicates found</p>
            <p className="text-xs text-muted-foreground">
              This list is populated by a{' '}
              <code className="font-mono">DUPLICATE_DETECTION</code> job. Run one
              from the Job Center to scan the archive.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {emphasized.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-amber-500 mb-3">
                High Priority ({emphasized.length})
              </h2>
              <div className="space-y-4">{emphasized.map(renderGroup)}</div>
            </div>
          )}
          {normal.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Duplicates ({normal.length})
              </h2>
              <div className="space-y-4">{normal.map(renderGroup)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
