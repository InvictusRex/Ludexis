'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api'
import type { User } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAuth } from '@/hooks/use-protected-route'
import { PaginationControls } from '@/components/common/pagination-controls'
import { buildPageQuery, DEFAULT_PAGE_SIZE, pageToOffset } from '@/lib/pagination'
import {
  ArrowLeft,
  Plus,
  Trash2,
  KeyRound,
  UserX,
  UserCheck,
  Loader2,
  Users,
  Shield,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth()
  useRequireAuth(user, authLoading)

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [creating, setCreating] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const PAGE_SIZE = DEFAULT_PAGE_SIZE

  const loadUsers = useCallback(async () => {
    try {
      const query = buildPageQuery(1, 100)
      const data = await usersApi.getAll(query.offset, query.limit)
      setUsers(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadUsers()
  }, [authLoading, user, loadUsers])

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password) return
    setCreating(true)
    try {
      await usersApi.create({
        username: username.trim(),
        email: email.trim(),
        password,
        is_superuser: isSuperuser,
      })
      setUsername('')
      setEmail('')
      setPassword('')
      setIsSuperuser(false)
      await loadUsers()
    } catch (err) {
      console.error('Failed to create user:', err)
      setError('Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (u: User) => {
    setTogglingId(u.id)
    try {
      if (u.is_active) {
        await usersApi.deactivate(u.id)
      } else {
        await usersApi.activate(u.id)
      }
      await loadUsers()
    } catch (err) {
      console.error('Failed to toggle user active status:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleResetPassword = async (u: User) => {
    const newPassword = window.prompt(`Enter a new password for ${u.username}:`)
    if (!newPassword) return
    setResettingId(u.id)
    try {
      await usersApi.resetPassword(u.id, newPassword)
      await loadUsers()
    } catch (err) {
      console.error('Failed to reset password:', err)
    } finally {
      setResettingId(null)
    }
  }

  const handleDelete = async (u: User) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
    setDeletingId(u.id)
    try {
      await usersApi.remove(u.id)
      await loadUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const rowBusy = (id: string) =>
    togglingId === id || deletingId === id || resettingId === id

  const totalUsers = users.length
  const userPageCount = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const currentPage = Math.min(page, userPageCount)
  const userPageStart = pageToOffset(currentPage, PAGE_SIZE)
  const visibleUsers = users.slice(userPageStart, userPageStart + PAGE_SIZE)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts</p>
      </div>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading users...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No users found. Create one below.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="font-medium text-foreground">{u.username}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.is_active ? 'default' : 'secondary'}
                        className={u.is_active ? 'bg-green-500/15 text-green-500 border-green-500/50' : ''}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.is_superuser ? (
                        <Badge variant="outline" className="border-accent/50 text-accent gap-1">
                          <Shield className="w-3 h-3" />
                          Superuser
                        </Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rowBusy(u.id)}
                          onClick={() => handleToggleActive(u)}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          className="border-border"
                        >
                          {togglingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : u.is_active ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rowBusy(u.id)}
                          onClick={() => handleResetPassword(u)}
                          title="Reset password"
                          className="border-border"
                        >
                          {resettingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <KeyRound className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rowBusy(u.id)}
                          onClick={() => handleDelete(u)}
                          title="Delete user"
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <PaginationControls
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={totalUsers}
            onPageChange={setPage}
          />

          {/* Create User */}
          <div className="border-t border-border pt-6 mt-6">
            <CardTitle className="text-lg mb-4">Create User</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="user-username">Username</Label>
                <Input
                  id="user-username"
                  placeholder="janedoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="user-superuser"
                    checked={isSuperuser}
                    onCheckedChange={(checked) => setIsSuperuser(checked === true)}
                  />
                  <Label htmlFor="user-superuser">Superuser</Label>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !username.trim() || !email.trim() || !password}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 mt-4"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
