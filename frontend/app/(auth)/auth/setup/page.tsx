"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getErrorMessage } from "@/lib/errors";
import { librariesApi } from "@/lib/api/libraries";
import { setupApi } from "@/lib/api/setup";
import { scansApi } from "@/lib/api/scans";
import { systemApi } from "@/lib/api/system";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthBrand } from "../auth-brand";

const STEPS = [
  {
    label: "Administrator",
    title: "Create the first administrator account",
    description: "This account manages libraries, users and server settings.",
  },
  {
    label: "Library",
    title: "Add your games folder",
    description: "Point Ludexis at the folder that holds your games. You can add more libraries later.",
  },
  {
    label: "Review",
    title: "Review and finish",
    description: "Ludexis creates your account and library, then starts the first scan.",
  },
];

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-ash">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");

  const [libraryName, setLibraryName] = useState("Main Library");
  // The Docker stack mounts GAMES_PATH here.
  const [libraryPath, setLibraryPath] = useState("/games");
  const [igdbClientId, setIgdbClientId] = useState("");
  const [igdbClientSecret, setIgdbClientSecret] = useState("");

  const [error, setError] = useState("");
  const [adminCreated, setAdminCreated] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setupApi
      .getStatus()
      .then((status) => {
        if (status.initialized) router.replace("/auth/login");
      })
      .catch(() => setError("Could not reach the server"));
  }, [router]);

  const handleCreateAdmin = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!adminUsername || !adminEmail || !adminPassword) {
      setError("Fill in every field");
      return;
    }
    if (adminPassword !== adminPasswordConfirm) {
      setError("Passwords do not match");
      return;
    }
    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setStep(2);
  };

  const handleConfigureLibrary = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!libraryName || !libraryPath) {
      setError("Enter a library name and folder");
      return;
    }
    setStep(3);
  };

  const handleCompleteSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      // A retry after a failed library step must not re-initialize (the backend returns 409).
      if (!adminCreated) {
        await setupApi.initialize({ username: adminUsername, email: adminEmail, password: adminPassword });
        setAdminCreated(true);
      }
      await login(adminUsername, adminPassword);
      await librariesApi.create({ name: libraryName, path: libraryPath });
      if (igdbClientId.trim() && igdbClientSecret) {
        await systemApi.updateSettings({ igdb_client_id: igdbClientId.trim(), igdb_client_secret: igdbClientSecret });
      }
      // The first scan starts right away; later scans follow the nightly schedule.
      await scansApi.runFull().catch(() => undefined);
      setCompleted(true);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Setup failed"));
    } finally {
      setLoading(false);
    }
  };

  const current = STEPS[step - 1];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
      <AuthBrand knightClassName="w-28 sm:w-36" />

      <section aria-labelledby="setup-heading" className="w-full rounded-lg border border-seam bg-vault p-6 sm:p-8">
        {completed ? (
          <div role="status" className="py-6 text-center">
            <Check aria-hidden="true" className="mx-auto size-10 text-moss" />
            <h2 id="setup-heading" className="mt-3 text-xl font-semibold text-parchment">
              Setup complete
            </h2>
            <p className="mt-1 text-sm text-ash">Opening your library…</p>
          </div>
        ) : (
          <>
            <ol aria-label="Setup steps" className="flex items-center gap-2 text-xs">
              {STEPS.map((item, index) => {
                const number = index + 1;
                const done = number < step;
                const active = number === step;
                return (
                  <li key={item.label} aria-current={active ? "step" : undefined} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "tabular grid size-6 place-items-center rounded-full font-semibold",
                        done && "bg-violet/30 text-violet-lit",
                        active && "bg-violet text-white",
                        !done && !active && "bg-stone text-ash",
                      )}
                    >
                      {done ? <Check aria-hidden="true" className="size-3.5" /> : number}
                    </span>
                    <span className={cn(active ? "text-parchment" : "sr-only text-ash sm:not-sr-only")}>
                      {item.label}
                      {done && <span className="sr-only"> (done)</span>}
                    </span>
                    {number < STEPS.length && <span aria-hidden="true" className="h-px w-4 bg-seam sm:w-6" />}
                  </li>
                );
              })}
            </ol>

            <h2 id="setup-heading" className="mt-6 text-xl font-semibold text-parchment">
              {current.title}
            </h2>
            <p className="mt-1 text-sm text-ash">{current.description}</p>

            {error && (
              <p role="alert" className="mt-5 rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-parchment">
                {error}
              </p>
            )}

            {step === 1 && (
              <form onSubmit={handleCreateAdmin} className="mt-6 space-y-5">
                <Field id="username" label="Username">
                  <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={adminUsername}
                    onChange={(event) => setAdminUsername(event.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field id="email" label="Email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    disabled={loading}
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="password" label="Password" hint="At least 6 characters">
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-describedby="password-hint"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      disabled={loading}
                    />
                  </Field>
                  <Field id="password-confirm" label="Confirm password">
                    <Input
                      id="password-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={adminPasswordConfirm}
                      onChange={(event) => setAdminPasswordConfirm(event.target.value)}
                      disabled={loading}
                    />
                  </Field>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  Continue
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleConfigureLibrary} className="mt-6 space-y-5">
                <Field id="library-name" label="Library name">
                  <Input
                    id="library-name"
                    value={libraryName}
                    onChange={(event) => setLibraryName(event.target.value)}
                    disabled={loading}
                  />
                </Field>
                <Field
                  id="library-path"
                  label="Games folder"
                  hint="The folder as the server sees it. With the Docker stack this is /games."
                >
                  <Input
                    id="library-path"
                    placeholder="/mnt/archive"
                    spellCheck={false}
                    aria-describedby="library-path-hint"
                    className="font-mono"
                    value={libraryPath}
                    onChange={(event) => setLibraryPath(event.target.value)}
                    disabled={loading}
                  />
                </Field>
                <div className="space-y-4 border-t border-seam pt-5">
                  <p className="text-sm text-ash">
                    VNDB and Steam work without keys. IGDB needs a Twitch application from dev.twitch.tv; you can also
                    add it later in Dashboard → Settings.
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="igdb-client-id" label="IGDB client ID (optional)">
                      <Input
                        id="igdb-client-id"
                        spellCheck={false}
                        value={igdbClientId}
                        onChange={(event) => setIgdbClientId(event.target.value)}
                        disabled={loading}
                      />
                    </Field>
                    <Field id="igdb-client-secret" label="IGDB client secret (optional)">
                      <Input
                        id="igdb-client-secret"
                        type="password"
                        autoComplete="new-password"
                        value={igdbClientSecret}
                        onChange={(event) => setIgdbClientSecret(event.target.value)}
                        disabled={loading}
                      />
                    </Field>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(1)}
                    disabled={loading || adminCreated}
                  >
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                    Continue
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleCompleteSetup} className="mt-6 space-y-5">
                <dl className="divide-y divide-seam rounded-lg border border-seam bg-stone/40 text-sm">
                  <div className="space-y-1 px-4 py-3">
                    <dt className="text-ash">Administrator</dt>
                    <dd className="break-words text-parchment">
                      {adminUsername} ({adminEmail})
                    </dd>
                  </div>
                  <div className="space-y-1 px-4 py-3">
                    <dt className="text-ash">Library</dt>
                    <dd className="break-words text-parchment">
                      {libraryName}: <span className="font-mono">{libraryPath}</span>
                    </dd>
                  </div>
                  <div className="space-y-1 px-4 py-3">
                    <dt className="text-ash">IGDB</dt>
                    <dd className="text-parchment">
                      {igdbClientId.trim() && igdbClientSecret ? "Credentials added" : "Not set up"}
                    </dd>
                  </div>
                </dl>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? "Finishing setup…" : "Finish setup"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
