'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { rolesApi, permissionsApi, adminApi } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAuth } from '@/hooks/use-protected-route'
import { EffectivePermissionsPanel } from '@/components/common/effective-permissions-panel'
import type { RoleRead, PermissionRead, PermissionReport } from '@/lib/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, CheckCircle2, Loader2, Plus, Trash2, XCircle } from 'lucide-react'

export default function AdminPermissions() {
  const [roles, setRoles] = useState<RoleRead[]>([])
  const [permissions, setPermissions] = useState<PermissionRead[]>([])
  const [report, setReport] = useState<PermissionReport>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])

  const { user, loading: authLoading } = useAuth()

  useRequireAuth(user, authLoading)

  useEffect(() => {
    if (authLoading) {
      return
    }

    const loadData = async () => {
      if (!user) {
        return
      }

      setLoading(true)
      setError(null)
      try {
        const [rolesResult, permissionsResult, reportResult] = await Promise.all([
          rolesApi.getAll(),
          permissionsApi.getAll(),
          adminApi.getPermissionReport(),
        ])
        setRoles(rolesResult)
        setPermissions(permissionsResult)
        setReport(reportResult)
      } catch (err) {
        console.error('Failed to load permissions data:', err)
        setError('Failed to load permissions data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [authLoading, user])

  const refresh = async () => {
    try {
      const [rolesResult, reportResult] = await Promise.all([
        rolesApi.getAll(),
        adminApi.getPermissionReport(),
      ])
      setRoles(rolesResult)
      setReport(reportResult)
    } catch (err) {
      console.error('Failed to refresh roles:', err)
      setError('Failed to refresh roles. Please try again.')
    }
  }

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Role name is required.')
      return
    }

    setCreating(true)
    setError(null)
    try {
      await rolesApi.create({
        name: name.trim(),
        description: description.trim() || null,
        permission_ids: selectedPermissionIds,
      })
      setName('')
      setDescription('')
      setSelectedPermissionIds([])
      await refresh()
    } catch (err) {
      console.error('Failed to create role:', err)
      setError('Failed to create role. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (role: RoleRead) => {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(role.id)
    setError(null)
    try {
      await rolesApi.remove(role.id)
      await refresh()
    } catch (err) {
      console.error('Failed to delete role:', err)
      setError('Failed to delete role. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const reportRoleNames = Object.keys(report)

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Permissions & Roles</h1>
        <p className="text-muted-foreground">Configure access control and roles</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading permissions...
        </div>
      ) : (
        <>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Create Role</CardTitle>
              <CardDescription>Add a new role with a set of permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  placeholder="e.g. Editor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  placeholder="Short description of the role"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                {permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`perm-${permission.id}`}
                          checked={selectedPermissionIds.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <Label
                          htmlFor={`perm-${permission.id}`}
                          className="text-sm text-foreground font-normal"
                        >
                          {permission.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create Role
              </Button>
            </CardContent>
          </Card>

          {roles.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">No roles found.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {roles.map((role) => (
                <Card key={role.id} className="border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{role.name}</CardTitle>
                        {role.description && (
                          <CardDescription>{role.description}</CardDescription>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border shrink-0"
                        onClick={() => handleDelete(role)}
                        disabled={deletingId === role.id}
                      >
                        {deletingId === role.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {role.permissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No permissions assigned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission) => (
                          <Badge key={permission.id} variant="outline" className="border-border">
                            {permission.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <EffectivePermissionsPanel />

          {reportRoleNames.length > 0 && permissions.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Permission Matrix</CardTitle>
                <CardDescription>Which roles can perform which actions</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      {permissions.map((permission) => (
                        <TableHead key={permission.id} className="text-center">
                          {permission.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportRoleNames.map((roleName) => (
                      <TableRow key={roleName}>
                        <TableCell className="font-medium text-foreground">{roleName}</TableCell>
                        {permissions.map((permission) =>
                          report[roleName].includes(permission.name) ? (
                            <TableCell key={permission.id} className="text-center">
                              <CheckCircle2 className="w-4 h-4 text-green-500 inline-block" />
                            </TableCell>
                          ) : (
                            <TableCell key={permission.id} className="text-center">
                              <XCircle className="w-4 h-4 text-muted-foreground/50 inline-block" />
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
