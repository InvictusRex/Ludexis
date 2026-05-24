'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'

export default function AdminArtwork() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Artwork Management</h1>
        <p className="text-muted-foreground">Manage and replace entry artwork</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Upload Artwork</CardTitle>
          <CardDescription>Replace cover art, banners, and screenshots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Drag and drop artwork here</p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Upload className="w-4 h-4" />
              Select Files
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WebP. Max 10 MB per file.</p>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Latest artwork replacements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm py-8 text-center">No uploads yet</p>
        </CardContent>
      </Card>
    </div>
  )
}
