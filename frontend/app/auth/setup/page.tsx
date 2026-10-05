'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { librariesApi } from '@/lib/api/libraries'
import { setupApi } from '@/lib/api/setup'
import { scansApi } from '@/lib/api/scans'
import { systemApi } from '@/lib/api/system'

export default function SetupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [adminUsername, setAdminUsername] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')

  const [libraryName, setLibraryName] = useState('Main Library')
  // The Docker stack mounts GAMES_PATH here.
  const [libraryPath, setLibraryPath] = useState('/games')
  const [igdbClientId, setIgdbClientId] = useState('')
  const [igdbClientSecret, setIgdbClientSecret] = useState('')

  const [error, setError] = useState('')
  const [adminCreated, setAdminCreated] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    setupApi
      .getStatus()
      .then((status) => {
        if (status.initialized) router.replace('/auth/login')
      })
      .catch(() => setError('Could not reach the server'))
  }, [router])

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!adminUsername || !adminEmail || !adminPassword) {
      setError('Please fill in all fields')
      return
    }

    if (adminPassword !== adminPasswordConfirm) {
      setError('Passwords do not match')
      return
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setStep(2)
  }

  const handleConfigureLibrary = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!libraryName || !libraryPath) {
      setError('Please enter a library name and path')
      return
    }

    setStep(3)
  }

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // A retry after a failed library step must not re-initialize (the backend returns 409).
      if (!adminCreated) {
        await setupApi.initialize({
          username: adminUsername,
          email: adminEmail,
          password: adminPassword,
        })
        setAdminCreated(true)
      }
      await login(adminUsername, adminPassword)
      await librariesApi.create({ name: libraryName, path: libraryPath })
      if (igdbClientId.trim() && igdbClientSecret) {
        await systemApi.updateSettings({ igdb_client_id: igdbClientId.trim(), igdb_client_secret: igdbClientSecret })
      }
      // The first scan starts right away; later scans follow the nightly schedule.
      await scansApi.runFull().catch(() => undefined)
      setCompleted(true)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">L</span>
            </div>
            <div>
              <CardTitle className="text-2xl">Ludexis Setup</CardTitle>
              <CardDescription>Initialize your game archive platform</CardDescription>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    s < step
                      ? 'bg-accent text-accent-foreground'
                      : s === step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`h-1 w-8 ${s < step ? 'bg-accent' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          {completed ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-accent mx-auto" />
              <div>
                <CardTitle className="text-xl mb-2">Setup Complete!</CardTitle>
                <CardDescription>
                  Your Ludexis archive platform is ready. Redirecting to home...
                </CardDescription>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Create Admin */}
              {step === 1 && (
                <form onSubmit={handleCreateAdmin} className="space-y-6">
                  <div>
                    <CardTitle className="text-lg mb-2">Create Admin Account</CardTitle>
                    <CardDescription>
                      Set up your initial administrator account
                    </CardDescription>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-lg flex gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Admin Username
                    </label>
                    <Input
                      id="username"
                      placeholder="admin"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Admin Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password-confirm" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={loading}
                  >
                    Continue
                  </Button>
                </form>
              )}

              {/* Step 2: Configure Library */}
              {step === 2 && (
                <form onSubmit={handleConfigureLibrary} className="space-y-6">
                  <div>
                    <CardTitle className="text-lg mb-2">Configure Library</CardTitle>
                    <CardDescription>
                      Set up your archive storage location
                    </CardDescription>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-lg flex gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="library-name" className="text-sm font-medium">
                      Library Name
                    </label>
                    <Input
                      id="library-name"
                      value={libraryName}
                      onChange={(e) => setLibraryName(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="library-path" className="text-sm font-medium">
                      Primary Archive Location
                    </label>
                    <Input
                      id="library-path"
                      placeholder="/mnt/archive"
                      value={libraryPath}
                      onChange={(e) => setLibraryPath(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Folder holding your games, as the server sees it. With the Docker stack this is /games.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="igdb-client-id" className="text-sm font-medium">
                      IGDB client ID (optional)
                    </label>
                    <Input
                      id="igdb-client-id"
                      value={igdbClientId}
                      onChange={(e) => setIgdbClientId(e.target.value)}
                      disabled={loading}
                    />
                    <label htmlFor="igdb-client-secret" className="text-sm font-medium">
                      IGDB client secret (optional)
                    </label>
                    <Input
                      id="igdb-client-secret"
                      type="password"
                      autoComplete="new-password"
                      value={igdbClientSecret}
                      onChange={(e) => setIgdbClientSecret(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      VNDB and Steam work without keys. IGDB needs a Twitch application from dev.twitch.tv; you can
                      also add it later under Admin &gt; Settings.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                      disabled={loading || adminCreated}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={loading}
                    >
                      Continue
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: Review & Complete */}
              {step === 3 && (
                <form onSubmit={handleCompleteSetup} className="space-y-6">
                  <div>
                    <CardTitle className="text-lg mb-2">Review Setup</CardTitle>
                    <CardDescription>
                      Verify your configuration before completing setup
                    </CardDescription>
                  </div>

                  <div className="space-y-4 bg-card p-4 rounded-lg border border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Admin Account</p>
                      <p className="font-medium text-foreground">{adminUsername} ({adminEmail})</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Library</p>
                      <p className="font-medium text-foreground">{libraryName}: {libraryPath}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-lg flex gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(2)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={loading}
                    >
                      {loading ? 'Completing...' : 'Complete Setup'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
