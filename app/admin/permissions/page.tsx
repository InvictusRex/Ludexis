'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminPermissions() {
  const roles = [
    { name: 'Admin', permissions: ['Full Access', 'Manage Users', 'Configure System'] },
    { name: 'Curator', permissions: ['Edit Metadata', 'Manage Collections', 'Upload Artwork'] },
    { name: 'User', permissions: ['View Archive', 'Create Collections', 'Rate Entries'] },
    { name: 'Guest', permissions: ['View Archive'] },
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.name} className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">{role.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {role.permissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-foreground">{perm}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="border-border w-full">
                Edit Role
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
