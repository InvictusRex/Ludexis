'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Trash2, Upload, User } from 'lucide-react'

export default function AdminAuditLogs() {
  const logs = [
    { id: '1', action: 'Metadata Updated', user: 'admin@example.com', timestamp: '2 hours ago', icon: Edit, color: 'text-blue-500' },
    { id: '2', action: 'Artwork Deleted', user: 'curator@example.com', timestamp: '5 hours ago', icon: Trash2, color: 'text-red-500' },
    { id: '3', action: 'Archive Uploaded', user: 'system', timestamp: '1 day ago', icon: Upload, color: 'text-green-500' },
    { id: '4', action: 'User Created', user: 'admin@example.com', timestamp: '3 days ago', icon: User, color: 'text-purple-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">Audit Logs</h1>
        <p className="text-muted-foreground">View system activity and changes</p>
      </div>

      <div className="space-y-4">
        {logs.map((log) => {
          const IconComponent = log.icon
          return (
            <Card key={log.id} className="border-border">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-5 h-5 ${log.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-sm text-muted-foreground">{log.user} • {log.timestamp}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
