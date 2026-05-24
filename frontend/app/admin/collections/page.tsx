'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

export default function AdminCollections() {
  const collections = [
    { id: '1', name: 'Retro Classics', entries: 24, owner: 'System' },
    { id: '2', name: 'Indie Games', entries: 18, owner: 'System' },
    { id: '3', name: 'Action Games', entries: 31, owner: 'System' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Collections Management</h1>
        <p className="text-muted-foreground">Create and manage user collections</p>
      </div>

      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
        <Plus className="w-4 h-4" />
        Create Collection
      </Button>

      <div className="space-y-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="border-border">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{collection.name}</p>
                <p className="text-sm text-muted-foreground">{collection.entries} entries • Owner: {collection.owner}</p>
              </div>
              <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
