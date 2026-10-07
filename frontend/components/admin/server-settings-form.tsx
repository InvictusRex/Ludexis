"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { systemApi } from "@/lib/api";
import type { ServerSettings, ServerSettingsUpdate } from "@/lib/types";
import { useApi } from "@/hooks/use-api";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/brand/empty-state";

export function ServerSettingsForm() {
  const loaded = useApi(() => systemApi.getSettings(), []);
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [serverName, setServerName] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [gridKey, setGridKey] = useState("");
  const [saving, setSaving] = useState(false);

  // The stored secret never comes back from the API; the field only ever holds a replacement.
  const apply = (data: ServerSettings) => {
    setSettings(data);
    setServerName(data.server_name);
    setOrder(data.provider_order);
    setClientId(data.igdb_client_id);
    setClientSecret("");
    setGridKey("");
  };

  useEffect(() => {
    if (loaded.data) apply(loaded.data);
  }, [loaded.data]);

  if (loaded.error) {
    return (
      <EmptyState
        title="Settings could not be loaded"
        description="Check that the server is running, then try again."
        action={<Button onClick={loaded.reload}>Try again</Button>}
      />
    );
  }

  if (!settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  // Enabled sources first, in their configured order, then the disabled ones.
  const providers = [...order, ...settings.available_providers.filter((name) => !order.includes(name))];

  const toggle = (name: string, enabled: boolean) =>
    setOrder((current) => (enabled ? [...current, name] : current.filter((item) => item !== name)));

  const move = (index: number, offset: number) =>
    setOrder((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const update: ServerSettingsUpdate = { server_name: serverName.trim(), provider_order: order };
    if (!settings.igdb_from_env) {
      update.igdb_client_id = clientId.trim();
      if (clientSecret) update.igdb_client_secret = clientSecret;
    }
    if (!settings.steamgriddb_from_env && gridKey) {
      update.steamgriddb_api_key = gridKey;
    }
    setSaving(true);
    try {
      apply(await systemApi.updateSettings(update));
      toastSuccess("Settings saved");
    } catch (error) {
      toastError(error, "Could not save the settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md space-y-2">
          <Label htmlFor="server-name">Server name</Label>
          <Input id="server-name" value={serverName} onChange={(event) => setServerName(event.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata sources</CardTitle>
          <CardDescription>
            New games are matched against the enabled sources in this order; the first confident match wins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="max-w-md divide-y divide-seam rounded-lg border border-seam">
            {providers.map((name) => {
              const index = order.indexOf(name);
              const enabled = index !== -1;
              return (
                <li key={name} className="flex items-center gap-3 px-3 py-2">
                  <span className="tabular w-5 text-sm text-ash">{enabled ? index + 1 : ""}</span>
                  <Checkbox
                    id={`provider-${name}`}
                    checked={enabled}
                    onCheckedChange={(checked) => toggle(name, checked === true)}
                  />
                  <Label htmlFor={`provider-${name}`} className={enabled ? "flex-1 text-parchment" : "flex-1 text-ash"}>
                    {name}
                  </Label>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Move ${name} up`}
                    disabled={!enabled || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Move ${name} down`}
                    disabled={!enabled || index === order.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IGDB</CardTitle>
          <CardDescription>
            {settings.igdb_from_env
              ? "These credentials come from the server environment; change them there."
              : "A Twitch developer app's credentials let Ludexis search IGDB."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="igdb-client-id">IGDB (Twitch) client ID</Label>
            <Input
              id="igdb-client-id"
              className="font-mono"
              autoComplete="off"
              value={clientId}
              disabled={settings.igdb_from_env}
              onChange={(event) => setClientId(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="igdb-client-secret">IGDB (Twitch) client secret</Label>
            <Input
              id="igdb-client-secret"
              type="password"
              autoComplete="new-password"
              placeholder={settings.igdb_configured ? "Saved; type to replace" : "Not set"}
              value={clientSecret}
              disabled={settings.igdb_from_env}
              onChange={(event) => setClientSecret(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SteamGridDB</CardTitle>
          <CardDescription>
            {settings.steamgriddb_from_env
              ? "This key comes from the server environment; change it there."
              : "An API key (steamgriddb.com, Preferences → API) adds community covers, banners and logos, filling the gaps the metadata sources leave."}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-w-md space-y-2">
          <Label htmlFor="steamgriddb-api-key">API key</Label>
          <Input
            id="steamgriddb-api-key"
            type="password"
            autoComplete="new-password"
            placeholder={settings.steamgriddb_configured ? "Saved; type to replace" : "Not set"}
            value={gridKey}
            disabled={settings.steamgriddb_from_env}
            onChange={(event) => setGridKey(event.target.value)}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !serverName.trim()}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
