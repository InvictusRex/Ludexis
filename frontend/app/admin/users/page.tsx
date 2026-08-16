'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi, rolesApi } from '@/lib/api'
import type { RoleRead, User } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAdmin } from '@/hooks/use-protected-route'
import { PaginationControls } from '@/components/common/pagination-controls'
import { buildPageQuery, DEFAULT_PAGE_SIZE, pageToOffset } from '@/lib/pagination'
import { toastError, toastSuccess } from '@/lib/toast'
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
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  useRequireAdmin(user, authLoading)

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [roles, setRoles] = useState<RoleRead[]>([])

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRoleIds, setEditingRoleIds] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)

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

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await rolesApi.getAll())
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadUsers()
    loadRoles()
  }, [authLoading, user, loadUsers, loadRoles])

  const toggleCreateRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    )
  }

  const toggleEditingRole = (roleId: string) => {
    setEditingRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    )
  }

  const openManageRoles = (u: User) => {
    setEditingUser(u)
    setEditingRoleIds((u.roles ?? []).map((r) => r.id))
  }

  const handleSaveRoles = async () => {
    if (!editingUser) return
    setSavingRoles(true)
    try {
      await usersApi.update(editingUser.id, { role_ids: editingRoleIds })
      toastSuccess('Roles updated')
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      toastError(err, 'Failed to update roles')
    } finally {
      setSavingRoles(false)
    }
  }

  const handleCreate = async () => {
    if (!username.trim() || !email.trim() || !password) return
    setCreating(true)
    try {
      await usersApi.create({
        username: username.trim(),
        email: email.trim(),
        password,
        is_superuser: isSuperuser,
        role_ids: selectedRoleIds,
      })
      setUsername('')
      setEmail('')
      setPassword('')
      setIsSuperuser(false)
      setSelectedRoleIds([])
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
                  <TableHead>Roles</TableHead>
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
                    <TableCell>
                      {u.roles && u.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={rowBusy(u.id)}
                          onClick={() => openManageRoles(u)}
                          title="Manage roles"
                          className="border-border"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Button>
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
            {roles.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Roles</Label>
                <div className="flex flex-wrap gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`create-role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleCreateRole(role.id)}
                      />
                      <Label htmlFor={`create-role-${role.id}`}>{role.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage roles</DialogTitle>
            <DialogDescription>
              {editingUser ? `Roles for ${editingUser.username}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles available.</p>
            ) : (
              roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-role-${role.id}`}
                    checked={editingRoleIds.includes(role.id)}
                    onCheckedChange={() => toggleEditingRole(role.id)}
                  />
                  <Label htmlFor={`edit-role-${role.id}`}>{role.name}</Label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveRoles}
              disabled={savingRoles}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              {savingRoles && <Loader2 className="w-4 h-4 animate-spin" />}
              Save roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
