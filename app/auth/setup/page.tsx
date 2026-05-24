'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('')

  const [libraryPath, setLibraryPath] = useState('/archive')
  const [metadataProvider, setMetadataProvider] = useState('IGDB')

  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!adminEmail || !adminPassword) {
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

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep(2)
    setLoading(false)
  }

  const handleConfigureLibrary = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!libraryPath) {
      setError('Please enter a library path')
      return
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep(3)
    setLoading(false)
  }

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userEmail', adminEmail)
    localStorage.setItem('setupCompleted', 'true')
    setCompleted(true)

    setTimeout(() => {
      router.push('/')
    }, 2000)
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
                    {loading ? 'Creating...' : 'Continue'}
                  </Button>
                </form>
              )}

              {/* Step 2: Configure Library */}
              {step === 2 && (
                <form onSubmit={handleConfigureLibrary} className="space-y-6">
                  <div>
                    <CardTitle className="text-lg mb-2">Configure Library</CardTitle>
                    <CardDescription>
                      Set up your archive storage location and metadata providers
                    </CardDescription>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/20 text-destructive text-sm rounded-lg flex gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

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
                      Path where your game archives are stored
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="metadata" className="text-sm font-medium">
                      Primary Metadata Provider
                    </label>
                    <select
                      id="metadata"
                      value={metadataProvider}
                      onChange={(e) => setMetadataProvider(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                    >
                      <option value="IGDB">IGDB</option>
                      <option value="Steam">Steam</option>
                      <option value="GOG">GOG</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Continue'}
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
                      <p className="text-sm text-muted-foreground">Admin Email</p>
                      <p className="font-medium text-foreground">{adminEmail}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Library Location</p>
                      <p className="font-medium text-foreground">{libraryPath}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Metadata Provider</p>
                      <p className="font-medium text-foreground">{metadataProvider}</p>
                    </div>
                  </div>

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
