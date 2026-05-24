'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

export default function AdminSettings() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-2 text-accent hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <h1 className="text-4xl font-bold text-foreground mb-2">System Settings</h1>
        <p className="text-muted-foreground">Configure system settings and appearance</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Archive Name</label>
            <Input placeholder="My Game Archive" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Description</label>
            <Input placeholder="A collection of retro games" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Primary Language</label>
            <select className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Save Settings</Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Color Scheme</label>
            <div className="flex gap-2">
              <button className="w-12 h-12 rounded-lg bg-background border-2 border-accent" />
              <button className="w-12 h-12 rounded-lg bg-blue-900" />
              <button className="w-12 h-12 rounded-lg bg-purple-900" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
