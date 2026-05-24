'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle, Image as ImageIcon, GitBranch } from 'lucide-react'

export default function AdminMetadata() {
  const reviewItems = [
    { id: '1', title: 'Unknown Game.zip', status: 'Unmatched', entries: 1 },
    { id: '2', title: 'Missing Banner Art', status: 'Missing Artwork', entries: 5 },
    { id: '3', title: 'Conflicting Match', status: 'Conflicting', entries: 2 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Metadata Review Queue</h1>
        <p className="text-muted-foreground">Review and correct archive metadata</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-500">7</p>
            <p className="text-sm text-muted-foreground">Unmatched Entries</p>
          </CardContent>
        </Card>
        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-500">12</p>
            <p className="text-sm text-muted-foreground">Missing Artwork</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-red-500">3</p>
            <p className="text-sm text-muted-foreground">Conflicting Matches</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Review Items</h2>
        {reviewItems.map((item) => (
          <Card key={item.id} className="border-border">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.status === 'Unmatched' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                {item.status === 'Missing Artwork' && <ImageIcon className="w-5 h-5 text-purple-500" />}
                {item.status === 'Conflicting' && <GitBranch className="w-5 h-5 text-red-500" />}
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.entries} entries</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {item.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
