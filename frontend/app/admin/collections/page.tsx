'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { collectionsApi } from '@/lib/api'
import type { ArchiveEntry, Collection } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { useRequireAdmin } from '@/hooks/use-protected-route'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileBox,
  Loader2,
  Plus,
  Trash2,
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminCollections() {
  const { user, loading: authLoading } = useAuth()
  useRequireAdmin(user, authLoading)

  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [creating, setCreating] = useState(false)

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [entriesByCollection, setEntriesByCollection] = useState<
    Record<string, ArchiveEntry[]>
  >({})
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState<string | null>(null)
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null)

  const loadCollections = useCallback(async () => {
    try {
      const data = await collectionsApi.getAll(0, 100)
      setCollections(data)
      setError(null)
    } catch (err) {
      console.error('Failed to load collections:', err)
      setError('Failed to load collections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    loadCollections()
  }, [authLoading, user, loadCollections])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      await collectionsApi.create({
        name: name.trim(),
        description: description.trim() || null,
        visibility,
      })
      setName('')
      setDescription('')
      setVisibility('public')
      await loadCollections()
    } catch (err) {
      console.error('Failed to create collection:', err)
      setError('Failed to create collection')
    } finally {
      setCreating(false)
    }
  }

  const handleToggleVisibility = async (collection: Collection) => {
    const next = collection.visibility === 'private' ? 'public' : 'private'
    setTogglingId(collection.id)
    try {
      await collectionsApi.update(collection.id, { visibility: next })
      await loadCollections()
    } catch (err) {
      console.error('Failed to update collection:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (collection: Collection) => {
    if (!window.confirm(`Delete collection "${collection.name}"?`)) return
    setDeletingId(collection.id)
    try {
      await collectionsApi.remove(collection.id)
      if (expandedId === collection.id) {
        setExpandedId(null)
      }
      await loadCollections()
    } catch (err) {
      console.error('Failed to delete collection:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleExpand = async (collection: Collection) => {
    if (expandedId === collection.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(collection.id)
    if (!entriesByCollection[collection.id]) {
      setEntriesLoading(true)
      setEntriesError(null)
      try {
        const entries = await collectionsApi.getEntries(collection.id)
        setEntriesByCollection((prev) => ({ ...prev, [collection.id]: entries }))
      } catch (err) {
        console.error('Failed to load collection entries:', err)
        setEntriesError('Failed to load entries')
      } finally {
        setEntriesLoading(false)
      }
    }
  }

  const handleRemoveEntry = async (collection: Collection, entry: ArchiveEntry) => {
    if (!window.confirm(`Remove "${entry.title}" from "${collection.name}"?`)) return
    setRemovingEntryId(entry.id)
    try {
      await collectionsApi.removeEntry(collection.id, entry.id)
      setEntriesByCollection((prev) => ({
        ...prev,
        [collection.id]: (prev[collection.id] ?? []).filter((e) => e.id !== entry.id),
      }))
      await loadCollections()
    } catch (err) {
      console.error('Failed to remove entry:', err)
    } finally {
      setRemovingEntryId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Collections Management</h1>
        <p className="text-muted-foreground">Create and manage game collections</p>
      </div>

      {/* Create Collection */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Create Collection</CardTitle>
          <CardDescription>Group related archive entries into a collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="col-name">Name</Label>
              <Input
                id="col-name"
                placeholder="Retro Classics"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-description">Description</Label>
              <Input
                id="col-description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as 'public' | 'private')}
              >
                <SelectTrigger id="col-visibility" className="w-full">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 mt-4"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Create Collection
          </Button>
        </CardContent>
      </Card>

      {/* Collections */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>{collections.length} collections total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading collections...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : collections.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileBox className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No collections yet. Create one above.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <Fragment key={collection.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6"
                            onClick={() => handleToggleExpand(collection)}
                          >
                            {expandedId === collection.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                          <span className="font-medium text-foreground">{collection.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {collection.description || '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingId === collection.id}
                          onClick={() => handleToggleVisibility(collection)}
                          className="gap-1.5"
                        >
                          {togglingId === collection.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : collection.visibility === 'private' ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <Badge
                            variant={collection.visibility === 'private' ? 'secondary' : 'default'}
                            className={
                              collection.visibility !== 'private'
                                ? 'bg-green-500/15 text-green-500 border-green-500/50'
                                : ''
                            }
                          >
                            {collection.visibility === 'private' ? 'Private' : 'Public'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {collection.entry_ids?.length ?? 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {collection.created_at
                          ? new Date(collection.created_at).toLocaleDateString()
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === collection.id}
                          onClick={() => handleDelete(collection)}
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          {deletingId === collection.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedId === collection.id && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          {entriesLoading ? (
                            <div className="flex items-center justify-center py-6 text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Loading entries...
                            </div>
                          ) : entriesError ? (
                            <div className="py-6 text-center text-red-500">{entriesError}</div>
                          ) : (entriesByCollection[collection.id] ?? []).length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground">
                              No entries in this collection.
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              {(entriesByCollection[collection.id] ?? []).map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{entry.title}</p>
                                    <p className="text-xs text-muted-foreground truncate font-mono">
                                      {entry.file_path}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={removingEntryId === entry.id}
                                    onClick={() => handleRemoveEntry(collection, entry)}
                                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 shrink-0"
                                  >
                                    {removingEntryId === entry.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
