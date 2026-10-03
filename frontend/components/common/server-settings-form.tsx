'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Settings2 } from 'lucide-react'
import { systemApi } from '@/lib/api'
import type { ServerSettings, ServerSettingsUpdate } from '@/lib/types'
import { toastError, toastSuccess } from '@/lib/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ServerSettingsForm() {
  const [settings, setSettings] = useState<ServerSettings | null>(null)
  const [serverName, setServerName] = useState('')
  const [order, setOrder] = useState<string[]>([])
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)

  const apply = (data: ServerSettings) => {
    setSettings(data)
    setServerName(data.server_name)
    setOrder(data.provider_order)
    setClientId(data.igdb_client_id)
    setClientSecret('')
  }

  useEffect(() => {
    systemApi.getSettings().then(apply).catch((error) => toastError(error, 'Failed to load settings'))
  }, [])

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading settings...
      </div>
    )
  }

  // Enabled providers first, in their configured order, then the disabled ones.
  const providers = [...order, ...settings.available_providers.filter((name) => !order.includes(name))]

  const toggle = (name: string, enabled: boolean) =>
    setOrder((current) => (enabled ? [...current, name] : current.filter((item) => item !== name)))

  const move = (index: number, offset: number) =>
    setOrder((current) => {
      const next = [...current]
      ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
      return next
    })

  const save = async () => {
    const update: ServerSettingsUpdate = { server_name: serverName.trim(), provider_order: order }
    if (!settings.igdb_from_env) {
      update.igdb_client_id = clientId.trim()
      if (clientSecret) update.igdb_client_secret = clientSecret
    }
    setSaving(true)
    try {
      apply(await systemApi.updateSettings(update))
      toastSuccess('Settings saved')
    } catch (error) {
      toastError(error, 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-accent" />
          Server Settings
        </CardTitle>
        <CardDescription>Server name, metadata sources and IGDB credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="server-name">Server name</Label>
          <Input id="server-name" value={serverName} onChange={(event) => setServerName(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Metadata sources</Label>
          <p className="text-xs text-muted-foreground">
            New entries are matched against enabled sources in this order; the first confident match wins.
          </p>
          <ul className="space-y-2">
            {providers.map((name) => {
              const index = order.indexOf(name)
              const enabled = index !== -1
              return (
                <li key={name} className="flex items-center gap-3 p-2 rounded-md border border-border">
                  <Checkbox
                    id={`provider-${name}`}
                    checked={enabled}
                    onCheckedChange={(checked) => toggle(name, checked === true)}
                  />
                  <Label htmlFor={`provider-${name}`} className="flex-1">
                    {name}
                  </Label>
                  <Button size="icon" variant="ghost" aria-label={`Move ${name} up`} disabled={!enabled || index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${name} down`}
                    disabled={!enabled || index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="igdb-client-id">IGDB (Twitch) client ID</Label>
          {settings.igdb_from_env && (
            <p className="text-xs text-muted-foreground">Set by the server environment; change it there.</p>
          )}
          <Input
            id="igdb-client-id"
            value={clientId}
            disabled={settings.igdb_from_env}
            onChange={(event) => setClientId(event.target.value)}
          />
          <Label htmlFor="igdb-client-secret">IGDB (Twitch) client secret</Label>
          <Input
            id="igdb-client-secret"
            type="password"
            autoComplete="new-password"
            placeholder={settings.igdb_configured ? 'Saved; type to replace' : 'Not set'}
            value={clientSecret}
            disabled={settings.igdb_from_env}
            onChange={(event) => setClientSecret(event.target.value)}
          />
        </div>

        <Button onClick={save} disabled={saving || !serverName.trim()}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save settings
        </Button>
      </CardContent>
    </Card>
  )
}
