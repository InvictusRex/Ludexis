'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, Loader2, Play } from 'lucide-react'
import { systemApi } from '@/lib/api'
import type { ScheduledTask } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAdmin } from '@/hooks/use-protected-route'
import { toastError, toastSuccess } from '@/lib/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const pad = (value: number) => String(value).padStart(2, '0')

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—')

export default function ScheduledTasksPage() {
  const { user, loading: authLoading } = useAuth()
  useRequireAdmin(user, authLoading)

  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setTasks(await systemApi.getScheduledTasks())
    } catch (error) {
      toastError(error, 'Failed to load scheduled tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user) load()
  }, [authLoading, user, load])

  const update = async (task: ScheduledTask, data: Parameters<typeof systemApi.updateScheduledTask>[1]) => {
    setBusyKey(task.key)
    try {
      const updated = await systemApi.updateScheduledTask(task.key, data)
      setTasks((current) => current.map((t) => (t.key === updated.key ? updated : t)))
    } catch (error) {
      toastError(error, 'Failed to update task')
    } finally {
      setBusyKey(null)
    }
  }

  const runNow = async (task: ScheduledTask) => {
    setBusyKey(task.key)
    try {
      await systemApi.runScheduledTask(task.key)
      toastSuccess(`${task.name} started`)
      await load()
    } catch (error) {
      toastError(error, 'Failed to start task')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Scheduled Tasks</h1>
        <p className="text-muted-foreground">
          Background jobs run on these schedules in the server&apos;s local time. A library whose drive is
          disconnected is skipped and checked again at the next library scan.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-accent" />
            Tasks
          </CardTitle>
          <CardDescription>Change when each task runs, turn it off, or run it now.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading scheduled tasks...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Runs</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>Next run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.key}>
                    <TableCell className="font-medium text-foreground">{task.name}</TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Enable ${task.name}`}
                        checked={task.enabled}
                        disabled={busyKey === task.key}
                        onCheckedChange={(enabled) => update(task, { enabled })}
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        aria-label={`${task.name} frequency`}
                        className="bg-background border border-border rounded-md px-2 py-1 text-sm"
                        value={task.day_of_week ?? -1}
                        disabled={busyKey === task.key}
                        onChange={(event) => update(task, { day_of_week: Number(event.target.value) })}
                      >
                        <option value={-1}>Daily</option>
                        {DAYS.map((day, index) => (
                          <option key={day} value={index}>
                            Weekly on {day}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="time"
                        aria-label={`${task.name} time`}
                        className="bg-background border border-border rounded-md px-2 py-1 text-sm"
                        value={`${pad(task.hour)}:${pad(task.minute)}`}
                        disabled={busyKey === task.key}
                        onChange={(event) => {
                          const [hour, minute] = event.target.value.split(':').map(Number)
                          if (!Number.isNaN(hour) && !Number.isNaN(minute)) update(task, { hour, minute })
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{formatDate(task.last_run_at)}</div>
                      {task.last_job_status && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {task.last_job_status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.enabled ? formatDate(task.next_run_at) : 'Disabled'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={busyKey === task.key} onClick={() => runNow(task)}>
                        {busyKey === task.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span className="ml-1">Run now</span>
                      </Button>
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
