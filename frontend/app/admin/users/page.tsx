'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Shield, AlertTriangle } from 'lucide-react'

export default function AdminUsers() {
  const users = [
    { id: '1', email: 'admin@example.com', role: 'Admin', status: 'Active' },
    { id: '2', email: 'curator@example.com', role: 'Curator', status: 'Active' },
    { id: '3', email: 'user@example.com', role: 'User', status: 'Active' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts</p>
      </div>

      <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
        <Plus className="w-4 h-4" />
        Create User
      </Button>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="border-border">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  {user.role === 'Admin' ? <Shield className="w-5 h-5 text-accent" /> : <AlertTriangle className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.role} • {user.status}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-border">
                Edit
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
