'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2, HardDrive } from 'lucide-react'

export default function AdminLibrary() {
  const [storageLocations, setStorageLocations] = useState([
    { id: '1', name: 'External HDD 1', path: '/mnt/hdd1', used: '450 GB', total: '1 TB' },
    { id: '2', name: 'External HDD 2', path: '/mnt/hdd2', used: '620 GB', total: '1 TB' },
    { id: '3', name: 'NAS Archive', path: '/mnt/nas', used: '2.1 TB', total: '4 TB' },
  ])
  const [newLocation, setNewLocation] = useState('')

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      setStorageLocations([
        ...storageLocations,
        {
          id: Math.random().toString(),
          name: `Storage ${storageLocations.length + 1}`,
          path: newLocation,
          used: '0 GB',
          total: 'TBD',
        },
      ])
      setNewLocation('')
    }
  }

  const handleRemoveLocation = (id: string) => {
    setStorageLocations(storageLocations.filter((loc) => loc.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Library Management</h1>
        <p className="text-muted-foreground">Configure archive storage locations and scanning</p>
      </div>

      {/* Storage Locations */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Storage Locations</CardTitle>
          <CardDescription>Configure where your game archives are stored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {storageLocations.map((location) => (
            <div key={location.id} className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{location.name}</p>
                  <p className="text-sm text-muted-foreground">{location.path}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {location.used} / {location.total}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveLocation(location.id)}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="/path/to/archive"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
            <Button
              onClick={handleAddLocation}
              className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scanning Controls */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Archive Scanning</CardTitle>
          <CardDescription>Run scans to discover and verify archives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto py-6 flex-col">
              <div className="text-lg font-semibold">Full Scan</div>
              <div className="text-xs text-accent-foreground/70">Scan all locations</div>
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto py-6 flex-col">
              <div className="text-lg font-semibold">Incremental</div>
              <div className="text-xs text-accent-foreground/70">Changes since last scan</div>
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 h-auto py-6 flex-col">
              <div className="text-lg font-semibold">Verify</div>
              <div className="text-xs text-accent-foreground/70">Check archive integrity</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
